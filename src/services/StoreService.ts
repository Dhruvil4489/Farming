import { prisma } from '@/lib/prisma';

export interface CheckoutInput {
  deliveryName: string;
  deliveryPhone: string;
  deliveryAddress: string;
  deliveryVillage?: string;
  deliveryDistrict: string;
  deliveryState?: string;
  deliveryPincode: string;
  paymentMethod?: string;
  notes?: string;
}

export class StoreService {
  /**
   * Search & List Products with filters
   */
  static async getProducts(params: {
    query?: string;
    categorySlug?: string;
    brandId?: string;
    crop?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: 'price_asc' | 'price_desc' | 'name_asc';
  }) {
    const where: any = { isAvailable: true };
    const andConditions: any[] = [];

    if (params.query) {
      andConditions.push({
        OR: [
          { name: { contains: params.query } },
          { description: { contains: params.query } },
          { composition: { contains: params.query } },
        ],
      });
    }
    if (params.categorySlug) {
      where.category = { slug: params.categorySlug };
    }
    if (params.brandId) {
      where.brandId = params.brandId;
    }
    if (params.crop) {
      andConditions.push({
        OR: [
          { cropTarget: { contains: params.crop.toLowerCase() } },
          { cropTarget: 'all_crops' },
          { cropTarget: 'all' },
        ],
      });
    }
    if (andConditions.length > 0) {
      where.AND = andConditions;
    }
    if (params.minPrice !== undefined || params.maxPrice !== undefined) {
      where.price = {};
      if (params.minPrice !== undefined) where.price.gte = params.minPrice;
      if (params.maxPrice !== undefined) where.price.lte = params.maxPrice;
    }

    let orderBy: any = { createdAt: 'desc' };
    if (params.sort === 'price_asc') orderBy = { price: 'asc' };
    if (params.sort === 'price_desc') orderBy = { price: 'desc' };
    if (params.sort === 'name_asc') orderBy = { name: 'asc' };

    const products = await prisma.product.findMany({
      where,
      include: {
        brand: true,
        category: true,
      },
      orderBy,
    });

    const categories = await prisma.productCategory.findMany({
      orderBy: { name: 'asc' },
    });

    const brands = await prisma.productBrand.findMany({
      orderBy: { name: 'asc' },
    });

    return { products, categories, brands };
  }

  static async getProductBySlug(slug: string) {
    return prisma.product.findUnique({
      where: { slug },
      include: {
        brand: true,
        category: true,
      },
    });
  }

  /**
   * Get user's cart with server-validated current prices and stock checks
   */
  static async getCart(userId: string) {
    const items = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          include: { brand: true, category: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let subtotal = 0;
    const validatedItems = items.map((item) => {
      const lineTotal = item.product.price * item.quantity;
      subtotal += lineTotal;
      const isOutOfStock = item.product.stock < item.quantity;

      return {
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        product: item.product,
        lineTotal,
        isOutOfStock,
        stockAvailable: item.product.stock,
      };
    });

    const deliveryFee = subtotal > 1000 || subtotal === 0 ? 0 : 70;
    const total = subtotal + deliveryFee;

    return {
      items: validatedItems,
      subtotal,
      deliveryFee,
      total,
      itemCount: validatedItems.reduce((acc, curr) => acc + curr.quantity, 0),
    };
  }

  /**
   * Add to Cart with stock enforcement
   */
  static async addToCart(userId: string, productId: string, quantity = 1) {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error('Quantity must be a positive whole number');
    }
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.isAvailable) throw new Error('Product not found or currently unavailable');

    const existing = await prisma.cartItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    const requestedTotalQty = (existing?.quantity || 0) + quantity;
    if (requestedTotalQty > product.stock) {
      throw new Error(`Only ${product.stock} units are currently in stock for ${product.name}`);
    }

    if (existing) {
      return prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: requestedTotalQty },
        include: { product: true },
      });
    }

    return prisma.cartItem.create({
      data: {
        userId,
        productId,
        quantity,
      },
      include: { product: true },
    });
  }

  /**
   * Update quantity
   */
  static async updateCartQuantity(userId: string, cartItemId: string, quantity: number) {
    if (quantity <= 0) {
      await prisma.cartItem.deleteMany({
        where: { id: cartItemId, userId },
      });
      return null;
    }

    const item = await prisma.cartItem.findFirst({
      where: { id: cartItemId, userId },
      include: { product: true },
    });
    if (!item) throw new Error('Cart item not found');

    if (quantity > item.product.stock) {
      throw new Error(`Cannot exceed available stock of ${item.product.stock} units`);
    }

    return prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
      include: { product: true },
    });
  }

  /**
   * Remove item from cart
   */
  static async removeFromCart(userId: string, cartItemId: string) {
    return prisma.cartItem.deleteMany({
      where: { id: cartItemId, userId },
    });
  }

  /**
   * Checkout: Transactional order creation with server-side price & stock validation
   */
  static async processCheckout(userId: string, input: CheckoutInput) {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      throw new Error('Your shopping cart is empty');
    }

    // 1. Verify all items are in stock
    for (const item of cartItems) {
      if (item.quantity > item.product.stock) {
        throw new Error(
          `Insufficient stock for "${item.product.name}". Available: ${item.product.stock}, in cart: ${item.quantity}`
        );
      }
    }

    // 2. Server-side total calculation
    let subtotal = 0;
    const orderItemsData = cartItems.map((item) => {
      const lineTotal = item.product.price * item.quantity;
      subtotal += lineTotal;
      return {
        productId: item.productId,
        productNameSnapshot: item.product.name,
        unitPriceSnapshot: item.product.price,
        packSizeSnapshot: item.product.packSize,
        quantity: item.quantity,
        totalPrice: lineTotal,
      };
    });

    const deliveryFee = subtotal > 1000 ? 0 : 70;
    const totalAmount = subtotal + deliveryFee;

    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const orderNumber = `SF-${new Date().getFullYear()}-${randomSuffix}`;

    // 3. Execute transactional write: create Order, OrderItems, decrement stock, clear cart
    const order = await prisma.$transaction(async (tx) => {
      // Create Order
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          status: 'confirmed',
          subtotal,
          deliveryFee,
          discount: 0,
          totalAmount,
          paymentMethod: input.paymentMethod || 'demo_checkout',
          paymentStatus: 'test_paid',
          isDemoOrder: true,
          deliveryName: input.deliveryName,
          deliveryPhone: input.deliveryPhone,
          deliveryAddress: input.deliveryAddress,
          deliveryVillage: input.deliveryVillage,
          deliveryDistrict: input.deliveryDistrict,
          deliveryState: input.deliveryState || 'Gujarat',
          deliveryPincode: input.deliveryPincode,
          notes: input.notes,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: {
            include: { product: true },
          },
        },
      });

      // Decrement stock
      for (const item of cartItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
          },
        });
      }

      // Empty user's cart
      await tx.cartItem.deleteMany({
        where: { userId },
      });

      return createdOrder;
    });

    return order;
  }

  /**
   * User Orders
   */
  static async getUserOrders(userId: string) {
    return prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getOrderById(orderId: string, userId?: string) {
    const where: any = { id: orderId };
    if (userId) {
      where.userId = userId;
    }

    return prisma.order.findFirst({
      where,
      include: {
        items: {
          include: { product: true },
        },
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });
  }
}
