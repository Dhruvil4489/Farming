import fs from 'fs';

const enPath = 'src/locales/en.json';
const hiPath = 'src/locales/hi.json';
const guPath = 'src/locales/gu.json';

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const hi = JSON.parse(fs.readFileSync(hiPath, 'utf8'));
const gu = JSON.parse(fs.readFileSync(guPath, 'utf8'));

// Updates for English
en.diagnosis_title = "Universal Crop Disease AI Engine";
en.diagnosis_subtitle = "Universal Multi-Model Crop Disease Intelligence System for Indian agriculture. Screen leaf photographs across Specialist models for Cotton, Wheat, Rice, and Chilli alongside Horticultural Benchmark networks with explainable differential diagnostics.";
en.diagnosis_cv_badge = "Multi-Model Crop Intelligence Engine";
en.diagnosis_cotton_specialist_title = "Cotton Disease Specialist Model Active";
en.diagnosis_cotton_specialist_desc = "Specialist EfficientNet-B2 neural network trained on ICAR-CICR cotton leaf blight, bacterial blight, grey mildew, and leaf curl virus classes.";
en.diagnosis_wheat_specialist_title = "Wheat Pathology Diagnostic Network Active";
en.diagnosis_wheat_specialist_desc = "ResNet-50 architecture trained on CIMMYT and ICAR-IIWBR wheat yellow rust, brown rust, stem rust, and powdery mildew classes.";
en.diagnosis_rice_specialist_title = "Rice Protection Vision Transformer Active";
en.diagnosis_rice_specialist_desc = "ViT-Small architecture trained on IRRI and ICAR-NRRI rice blast, bacterial leaf blight, brown spot, and sheath blight classes.";
en.diagnosis_validation_title = "Specialist Model In Field Validation";
en.diagnosis_validation_desc = "Specialist diagnostic weights for this crop are undergoing multi-season field validation with State Agricultural Universities. Below are verified regional symptoms and ICAR prevention guidelines.";
en.diagnosis_feedback_title = "Diagnostic Accuracy Feedback";
en.diagnosis_feedback_thanks = "Thank you! Your feedback has been recorded to improve model precision.";

// Updates for Hindi
hi.diagnosis_title = "सार्वभौमिक फसल रोग एआई इंजन";
hi.diagnosis_subtitle = "भारतीय कृषि के लिए बहु-मॉडल फसल रोग बुद्धिमत्ता प्रणाली। कपास, गेहूं, चावल और मिर्च के विशेषज्ञ मॉडल तथा बागवानी नेटवर्क से पत्तियों के रोगों की सटीक पहचान करें।";
hi.diagnosis_cv_badge = "मल्टी-मॉडल फसल बुद्धिमत्ता इंजन";
hi.diagnosis_cotton_specialist_title = "कपास रोग विशेषज्ञ मॉडल सक्रिय";
hi.diagnosis_cotton_specialist_desc = "आईसीएआर-सीआईसीआर अनुसंधान पर आधारित एफिशिएंटनेट-बी2 मॉडल: पत्ती झुलसा, जीवाणु झुलसा, दहिया रोग और लीफ कर्ल वायरस की पहचान।";
hi.diagnosis_wheat_specialist_title = "गेहूं रोग विशेषज्ञ मॉडल सक्रिय";
hi.diagnosis_wheat_specialist_desc = "सिमिट और आईसीएआर-आईआईडब्ल्यूबीआर अनुसंधान: पीला रतुआ, भूरा रतुआ, काला रतुआ और चूर्णिल फफूंद की पहचान।";
hi.diagnosis_rice_specialist_title = "धान (चावल) सुरक्षा विज़न ट्रांसफार्मर सक्रिय";
hi.diagnosis_rice_specialist_desc = "आईआरआरआई और आईसीएआर-एनआरआरआई डेटासेट: झुलसा (ब्लास्ट), जीवाणु पत्ती झुलसा, भूरा धब्बा और शीथ ब्लाइट की पहचान।";
hi.diagnosis_validation_title = "विशेषज्ञ मॉडल फील्ड सत्यापन में है";
hi.diagnosis_validation_desc = "इस फसल के लिए मॉडल का विश्वविद्यालय स्तर पर बहु-ऋतु सत्यापन चल रहा है। नीचे क्षेत्रीय लक्षण एवं आईसीएआर रोकथाम के उपाय दिए गए हैं।";
hi.diagnosis_feedback_title = "निदान सटीकता प्रतिक्रिया";
hi.diagnosis_feedback_thanks = "धन्यवाद! मॉडल की सटीकता सुधारने के लिए आपकी प्रतिक्रिया दर्ज कर ली गई है।";

// Updates for Gujarati
gu.diagnosis_title = "સાર્વત્રિક પાક રોગ એઆઈ એન્જિન";
gu.diagnosis_subtitle = "ભારતીય ખેતી માટે મલ્ટી-મોડલ પાક રોગ ઇન્ટેલિજન્સ સિસ્ટમ. કપાસ, ઘઉં, ડાંગર અને મરચાંના સ્પેશિયાલિસ્ટ મોડલ દ્વારા પાકના રોગોની સચોટ તપાસ અને આઈસીએઆર માર્ગદર્શન મેળવો.";
gu.diagnosis_cv_badge = "મલ્ટી-મોડલ પાક ઇન્ટેલિજન્સ એન્જિન";
gu.diagnosis_cotton_specialist_title = "કપાસ રોગ સ્પેશિયાલિસ્ટ મોડલ સક્રિય";
gu.diagnosis_cotton_specialist_desc = "આઈસીએઆર-સીઆઈસીઆર રિસર્ચ આધારિત એફિશિયન્ટનેટ-બી2 મોડલ: પાનનો સુકારો, ખૂણીયા ટપકાં, દહિયા રોગ અને કપાસ વાયરસની ચોક્કસ તપાસ.";
gu.diagnosis_wheat_specialist_title = "ઘઉં રોગ સ્પેશિયાલિસ્ટ મોડલ સક્રિય";
gu.diagnosis_wheat_specialist_desc = "આઈસીએઆર-આઈઆઈડબલ્યુબીઆર આધારિત મોડલ: પીળો ગેરુ, કથ્થઈ ગેરુ, કાળો ગેરુ અને ભૂકી છારોની તપાસ.";
gu.diagnosis_rice_specialist_title = "ડાંગર સંરક્ષણ વિઝન ટ્રાન્સફોર્મર સક્રિય";
gu.diagnosis_rice_specialist_desc = "આઈઆરઆરઆઈ અને આઈસીએઆર-એનઆરઆરઆઈ આધારિત મોડલ: ડાંગરનો કરમોજી (બ્લાસ્ટ), બેક્ટેરિયલ બ્લાઇટ, બદામી ટપકાં અને સુકારો.";
gu.diagnosis_validation_title = "સ્પેશિયાલિસ્ટ મોડલ ક્ષેત્ર ચકાસણી હેઠળ છે";
gu.diagnosis_validation_desc = "આ પાક માટે કૃષિ યુનિવર્સિટીઓ સાથે મોડલ પરીક્ષણ ચાલુ છે. નીચે સામાન્ય પ્રાદેશિક લક્ષણો અને આઈસીએઆર ઉપાયો આપેલા છે.";
gu.diagnosis_feedback_title = "નિદાન ચોકસાઈ પ્રતિસાદ";
gu.diagnosis_feedback_thanks = "આભાર! મોડલની ચોકસાઈ સુધારવા માટે તમારો પ્રતિસાદ નોંધી લેવામાં આવ્યો છે.";

fs.writeFileSync(enPath, JSON.stringify(en, null, 2), 'utf8');
fs.writeFileSync(hiPath, JSON.stringify(hi, null, 2), 'utf8');
fs.writeFileSync(guPath, JSON.stringify(gu, null, 2), 'utf8');

console.log('✔ Updated en.json, hi.json, gu.json with universal multi-model terminology');

