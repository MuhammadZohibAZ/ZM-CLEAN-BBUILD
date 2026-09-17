import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  Search,
  MapPin,
  Plus,
  Minus,
  SlidersHorizontal,
  ChevronRight,
  X,
  Clock,
  Wheat,
  Layers,
  ArrowLeft,
  Locate,
  BookOpen,
  Info,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ChevronUp,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Data model                                                         */
/* ------------------------------------------------------------------ */

export interface Mandi {
  id: string;
  name: string;
  city: string;
  district: string;
  province: string;
  latitude: number;
  longitude: number;
  commodities: string[];
  openingTime: string;
  closingTime: string;
  activeListings: number;
  lastRateUpdateMinutesAgo: number;
  status: "open" | "closed";
  agriProfile: string;
  minRate?: number;
  maxRate?: number;
  trend?: "up" | "down" | "flat" | "stable";
  trendPct?: number;
}

export type ProvinceName =
  | "Punjab"
  | "Sindh"
  | "Khyber Pakhtunkhwa"
  | "Balochistan"
  | "Islamabad Capital Territory"
  | "Gilgit-Baltistan"
  | "Azad Jammu & Kashmir";

export interface ProvinceInfo {
  name: ProvinceName;
  short: string;
  outlines: [number, number][][];
  fill: string;
  fillActive: string;
}

function mk(
  name: string,
  city: string,
  district: string,
  province: string,
  latitude: number,
  longitude: number,
  commodities: string[],
  openingTime: string,
  closingTime: string,
  activeListings: number,
  lastRateUpdateMinutesAgo: number,
  status: "open" | "closed",
  agriProfile: string,
  minRate = 3850,
  maxRate = 4120,
  trend: "up" | "down" | "flat" | "stable" = "up",
  trendPct = 1.8
): Mandi {
  return {
    id: `${city}-${name}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
    city,
    district,
    province,
    latitude,
    longitude,
    commodities,
    openingTime,
    closingTime,
    activeListings,
    lastRateUpdateMinutesAgo,
    status,
    agriProfile,
    minRate,
    maxRate,
    trend,
    trendPct,
  };
}

export const MANDI_DATA: Mandi[] = [
  mk("Pakpattan Mandi", "Pakpattan", "Pakpattan", "Punjab", 30.3453, 73.3903, ["Wheat", "Livestock"], "5:30 AM", "6:00 PM", 52, 219, "open", "Pakpattan, on the Sutlej River, is known for wheat, sugarcane and citrus production, alongside its status as a major Sufi shrine city.", 3850, 4120, "up", 2.1),
  mk("Ghotki Mandi", "Ghotki", "Ghotki", "Sindh", 28.0079, 69.3159, ["Wheat", "Maize", "Vegetables"], "5:00 AM", "6:30 PM", 93, 20, "open", "Ghotki sits along the Indus in northern Sindh and is a key wheat, rice and sugarcane market for the province, feeding several sugar mills in the district.", 3780, 4050, "up", 1.4),
  mk("Nawabshah Mandi", "Nawabshah", "Shaheed Benazirabad", "Sindh", 26.2442, 68.41, ["Wheat", "Fruits", "Vegetables", "Livestock"], "6:00 AM", "7:00 PM", 161, 148, "open", "Nawabshah (Shaheed Benazirabad) is one of Sindh's major cotton and sugarcane trading centres, with several textile and sugar mills built around its agricultural output.", 3800, 4080, "stable", 0.5),
  mk("Sukkur Mandi", "Sukkur", "Sukkur", "Sindh", 27.7052, 68.8574, ["Wheat", "Livestock"], "5:30 AM", "6:00 PM", 52, 159, "open", "Sukkur sits beside the historic Sukkur Barrage, whose canal network irrigates much of lower Sindh, making the city a major wheat, rice and date trading hub.", 3790, 4060, "up", 1.7),
  mk("Pano Aqil Mandi", "Pano Aqil", "Sukkur", "Sindh", 27.8578, 69.1086, ["Wheat", "Vegetables", "Fruits"], "6:00 AM", "7:00 PM", 167, 214, "open", "Pano Aqil, near Sukkur, is a grain and livestock market town supplying wheat and rice grown along the Rohri Canal command area.", 3810, 4090, "down", -0.8),
  mk("Shikarpur Mandi", "Shikarpur", "Shikarpur", "Sindh", 27.9556, 68.6382, ["Wheat", "Cotton"], "6:00 AM", "7:00 PM", 125, 52, "closed", "Shikarpur is a historic Sindh trading city long known for its dried-fruit and pickle trade, alongside wheat and rice grown in the surrounding canal-irrigated plains.", 3770, 4030, "flat", 0.0),
  mk("Digri Mandi", "Digri", "Mirpurkhas", "Sindh", 25.1553, 69.1216, ["Wheat", "Cotton"], "5:30 AM", "6:00 PM", 295, 102, "closed", "Digri, in Mirpurkhas district, sits at the heart of Sindh's mango belt and is a key collection point for the Sindhri mango variety grown across the district.", 3830, 4110, "up", 1.2),
  mk("Naushahro Feroze Mandi", "Naushahro Feroze", "Naushahro Feroze", "Sindh", 26.8425, 68.1273, ["Wheat", "Cotton"], "5:00 AM", "7:00 PM", 15, 2, "closed", "Naushahro Feroze is a rice, wheat and chilli growing district of central Sindh along the Rohri Canal, with its mandi serving as a key produce collection point.", 3800, 4070, "down", -1.1),
  mk("Karachi Mandi", "Karachi", "Karachi", "Sindh", 24.8607, 67.0011, ["Wheat", "Sugarcane"], "6:00 AM", "6:00 PM", 194, 181, "open", "Karachi's produce markets are the largest wholesale hub in Pakistan, drawing fruit, vegetables and grain from across the country before onward distribution and export through the port.", 3920, 4220, "up", 2.6),
  mk("Gharo Mandi", "Gharo", "Thatta", "Sindh", 24.7458, 67.585, ["Wheat", "Maize"], "6:00 AM", "7:00 PM", 98, 145, "open", "Gharo, also in Thatta district near the coast, supports rice and fodder cultivation alongside fishing communities of the Indus delta.", 3840, 4100, "up", 0.9),
  mk("Sanghar Mandi", "Sanghar", "Sanghar", "Sindh", 26.0466, 68.9469, ["Wheat", "Cotton", "Sugarcane"], "6:00 AM", "6:00 PM", 20, 187, "closed", "Sanghar district is one of Sindh's top cotton and red-chilli producing areas, and its mandi is a key trading point for both crops.", 3810, 4080, "stable", 0.3),
  mk("Sinjhoro Mandi", "Sinjhoro", "Sanghar", "Sindh", 26.0507, 69.4747, ["Wheat", "Maize"], "5:30 AM", "6:00 PM", 208, 195, "open", "Sinjhoro, also in Sanghar district, serves the same cotton and chilli belt, giving farmers a secondary local market close to their fields.", 3820, 4090, "up", 1.5),
  mk("Okara Mandi", "Okara", "Okara", "Punjab", 30.8081, 73.4534, ["Wheat", "Cotton"], "5:30 AM", "7:00 PM", 175, 42, "closed", "Okara is home to some of Pakistan's largest government dairy and livestock farms, and its mandi handles wheat, rice and fodder crops from the surrounding canal colonies.", 3870, 4150, "up", 2.3),
  mk("Depalpur Mandi", "Depalpur", "Okara", "Punjab", 30.6702, 73.6852, ["Wheat", "Sugarcane"], "5:00 AM", "6:00 PM", 84, 191, "open", "Depalpur, in Okara district, is a wheat and cotton trading town within Punjab's historic canal-colony farmland.", 3860, 4130, "up", 1.8),
  mk("Arifwala Mandi", "Arifwala", "Pakpattan", "Punjab", 30.2967, 73.0645, ["Wheat", "Livestock"], "6:00 AM", "7:00 PM", 152, 79, "open", "Arifwala, in Pakpattan district, is a significant cotton and citrus market town in Punjab's fertile Sutlej basin.", 3855, 4125, "up", 2.0),
  mk("Patoki Mandi", "Patoki", "Kasur", "Punjab", 31.0233, 73.8534, ["Wheat", "Maize"], "6:00 AM", "7:00 PM", 68, 55, "open", "Patoki, in Kasur district, is a noted centre for flower and vegetable cultivation supplying Lahore's urban markets, alongside grain crops.", 3890, 4170, "up", 2.4),
  mk("Sahiwal Mandi", "Sahiwal", "Sahiwal", "Punjab", 30.6682, 73.1114, ["Wheat", "Cotton", "Sugarcane"], "5:00 AM", "6:00 PM", 180, 47, "closed", "Sahiwal lends its name to the Sahiwal cattle breed, one of South Asia's best dairy breeds, and its mandi anchors a rich wheat and sugarcane growing district.", 3880, 4160, "up", 2.2),
  mk("Chichawatni Mandi", "Chichawatni", "Sahiwal", "Punjab", 30.5333, 72.6975, ["Wheat", "Cotton", "Sugarcane"], "5:00 AM", "7:00 PM", 30, 197, "closed", "Chichawatni, in Sahiwal district, is a wheat and cotton market town within one of Punjab's oldest canal-irrigated colonies.", 3865, 4140, "up", 1.6),
  mk("Khanewal Mandi", "Khanewal", "Khanewal", "Punjab", 30.3, 71.9333, ["Wheat", "Rice"], "5:00 AM", "6:30 PM", 186, 53, "open", "Khanewal district is a major citrus and mango producing area of southern Punjab, and its mandi is a key export-oriented fruit market.", 3875, 4155, "up", 2.5),
  mk("Bahawalpur Mandi", "Bahawalpur", "Bahawalpur", "Punjab", 29.3956, 71.6836, ["Wheat", "Maize"], "5:00 AM", "7:00 PM", 78, 65, "open", "Bahawalpur, gateway to the Cholistan Desert, is a major cotton, mango and date market and a hub for the livestock economy of the Cholistan tract.", 3840, 4110, "down", -0.5),
  mk("Haroonabad Mandi", "Haroonabad", "Bahawalnagar", "Punjab", 29.5644, 73.1288, ["Wheat", "Maize"], "6:00 AM", "7:00 PM", 158, 25, "open", "Haroonabad, in Bahawalnagar district, is a cotton and wheat trading town in Punjab's southeastern cotton belt.", 3845, 4115, "up", 1.1),
  mk("Fort Abbas Mandi", "Fort Abbas", "Bahawalnagar", "Punjab", 29.1928, 72.8536, ["Wheat", "Livestock"], "5:30 AM", "7:00 PM", 82, 189, "open", "Fort Abbas, on the edge of the Cholistan Desert, supports cotton and livestock farming typical of Bahawalnagar district's arid margins.", 3830, 4100, "stable", 0.2),
  mk("Minchinabad Mandi", "Minchinabad", "Bahawalnagar", "Punjab", 30.1622, 73.5653, ["Wheat", "Cotton", "Sugarcane"], "5:00 AM", "6:00 PM", 120, 47, "closed", "Minchinabad, in Bahawalnagar district, serves the surrounding cotton and wheat growing villages near the Indian border.", 3850, 4120, "up", 1.5),
  mk("Rahim Yar Khan Mandi", "Rahim Yar Khan", "Rahim Yar Khan", "Punjab", 28.42, 70.3, ["Wheat", "Cotton"], "6:00 AM", "6:30 PM", 275, 22, "closed", "Rahim Yar Khan district is one of Pakistan's largest sugarcane and cotton producers, home to major sugar mills fed by the district's cane crop.", 3810, 4080, "up", 1.0),
  mk("Sadiqabad Mandi", "Sadiqabad", "Rahim Yar Khan", "Punjab", 28.3, 70.117, ["Wheat", "Cotton", "Sugarcane"], "5:00 AM", "6:30 PM", 150, 137, "closed", "Sadiqabad, in Rahim Yar Khan district, is a key cotton and sugarcane market town near the Sindh border.", 3805, 4075, "down", -0.9),
  mk("Multan Mandi", "Multan", "Multan", "Punjab", 30.1575, 71.5249, ["Wheat", "Rice"], "5:00 AM", "6:30 PM", 36, 83, "open", "Multan, the 'City of Mangoes and Saints', is one of Pakistan's most important mango and citrus export hubs and a major cotton and wheat trading centre for southern Punjab.", 3895, 4185, "up", 2.7),
  mk("Muzaffargarh Mandi", "Muzaffargarh", "Muzaffargarh", "Punjab", 30.0703, 71.1932, ["Wheat", "Sugarcane"], "6:00 AM", "6:30 PM", 194, 241, "open", "Muzaffargarh, in the Indus-Chenab doab, is a significant cotton and wheat producing district, with its mandi central to the region's crop trade.", 3860, 4135, "up", 1.9),
  mk("Chowk Azam Mandi", "Chowk Azam", "Layyah", "Punjab", 30.9648, 71.217, ["Wheat", "Livestock"], "6:00 AM", "6:00 PM", 272, 199, "open", "Chowk Azam, in Layyah district, sits in a belt known for guava orchards along the Indus, alongside wheat and cotton cultivation.", 3840, 4110, "stable", 0.0),
  mk("Rajanpur Mandi", "Rajanpur", "Rajanpur", "Punjab", 29.1044, 70.3301, ["Wheat", "Cotton"], "6:00 AM", "6:00 PM", 95, 82, "closed", "Rajanpur, in southern Punjab near the Sindh and Balochistan borders, supports wheat, cotton and livestock farming along the Indus floodplain.", 3825, 4095, "up", 1.3),
  mk("DG Khan Mandi", "DG Khan", "Dera Ghazi Khan", "Punjab", 30.0561, 70.6349, ["Wheat", "Sugarcane"], "5:00 AM", "7:00 PM", 114, 101, "open", "Dera Ghazi Khan, at the foot of the Sulaiman mountain range, is known for mango orchards and wheat cultivation irrigated by the Indus.", 3850, 4125, "up", 1.7),
  mk("Mianwali Mandi", "Mianwali", "Mianwali", "Punjab", 32.5839, 71.5371, ["Wheat", "Maize"], "5:00 AM", "6:00 PM", 258, 125, "open", "Mianwali, on the western edge of the Thal Desert, produces wheat, gram and groundnut, with orchards along the Indus River.", 3870, 4150, "up", 2.1),
  mk("Jhang Mandi", "Jhang", "Jhang", "Punjab", 31.2681, 72.3181, ["Wheat", "Sugarcane"], "5:30 AM", "6:30 PM", 64, 171, "open", "Jhang, on the banks of the Chenab, is known for its buffalo and cattle livestock markets alongside cotton and wheat farming.", 3865, 4140, "up", 1.8),
  mk("Shorkot Mandi", "Shorkot", "Jhang", "Punjab", 30.8236, 72.14, ["Wheat", "Rice"], "5:00 AM", "7:00 PM", 186, 233, "open", "Shorkot, in Jhang district, is a wheat and cotton trading town along the Chenab River floodplain.", 3855, 4130, "up", 1.6),
  mk("Chiniot Mandi", "Chiniot", "Chiniot", "Punjab", 31.72, 72.9781, ["Wheat", "Rice"], "5:30 AM", "6:00 PM", 286, 93, "open", "Chiniot, on the Chenab, supports wheat and vegetable farming, complementing the city's better-known furniture and woodworking industry.", 3875, 4160, "up", 2.0),
  mk("Samundri Mandi", "Samundri", "Faisalabad", "Punjab", 31.0806, 72.9667, ["Wheat", "Cotton", "Sugarcane"], "6:00 AM", "7:00 PM", 50, 37, "closed", "Samundri, in Faisalabad district, is a wheat and cotton market town within Punjab's central textile-crop belt.", 3880, 4165, "up", 2.2),
  mk("Toba Tek Singh Mandi", "Toba Tek Singh", "Toba Tek Singh", "Punjab", 30.9709, 72.4839, ["Wheat", "Livestock"], "5:30 AM", "7:00 PM", 232, 159, "open", "Toba Tek Singh district is a leading dairy and wheat producing area of central Punjab, with its mandi serving both crop and livestock trade.", 3870, 4150, "up", 1.9),
  mk("Gojra Mandi", "Gojra", "Toba Tek Singh", "Punjab", 31.1494, 72.6822, ["Wheat", "Sugarcane"], "6:00 AM", "7:00 PM", 224, 31, "open", "Gojra, in Toba Tek Singh district, is a cotton and wheat market town within Punjab's canal-irrigated heartland.", 3865, 4145, "up", 1.7),
  mk("Kamalia Mandi", "Kamalia", "Toba Tek Singh", "Punjab", 30.7281, 72.6489, ["Wheat", "Livestock"], "6:00 AM", "7:00 PM", 152, 199, "open", "Kamalia, also in Toba Tek Singh district, supports cotton and sugarcane cultivation and is known for its handloom khaddar cloth woven from local cotton.", 3860, 4135, "up", 1.5),
  mk("Sargodha Mandi", "Sargodha", "Sargodha", "Punjab", 32.0836, 72.6711, ["Wheat", "Cotton", "Sugarcane"], "5:00 AM", "7:00 PM", 120, 47, "closed", "Sargodha is known as Pakistan's 'Kinnow Capital', producing the bulk of the country's kinnow citrus for both domestic sale and export.", 3885, 4175, "up", 2.3),
  mk("Siranwali Mandi", "Siranwali", "Gujranwala", "Punjab", 31.825, 72.5389, ["Wheat", "Livestock"], "5:00 AM", "6:30 PM", 102, 89, "open", "Siranwali (Sillanwali), in the Sargodha citrus belt, is a smaller collection market for kinnow and wheat grown in the surrounding orchards.", 3870, 4150, "up", 1.8),
  mk("Pasrur Mandi", "Pasrur", "Sialkot", "Punjab", 32.2617, 74.6572, ["Wheat", "Vegetables", "Fruits"], "5:30 AM", "6:00 PM", 97, 204, "open", "Pasrur, also in Sialkot district, is a wheat and rice trading centre in Punjab's northeastern basmati belt.", 3890, 4180, "up", 2.4),
  mk("Muridke Mandi", "Muridke", "Sheikhupura", "Punjab", 31.8025, 74.2586, ["Wheat", "Cotton"], "6:00 AM", "6:00 PM", 185, 232, "closed", "Muridke, in Sheikhupura district, supplies dairy, vegetables and rice to nearby Lahore's urban food market.", 3910, 4200, "up", 2.6),
  mk("Sharqpur Mandi", "Sharqpur", "Sheikhupura", "Punjab", 31.4633, 74.1, ["Wheat", "Rice"], "6:00 AM", "6:00 PM", 116, 103, "open", "Sharaqpur, also in Sheikhupura district, is a smaller rice and vegetable market town near the Ravi River.", 3895, 4185, "up", 2.1),
  mk("Faqirwali Mandi", "Faqirwali", "Sheikhupura", "Punjab", 29.47, 73.04, ["Wheat", "Cotton", "Sugarcane"], "6:00 AM", "6:00 PM", 80, 187, "closed", "Faqirwali, in the Bahawalnagar cotton belt, is a cotton and wheat trading town serving southeastern Punjab's farmers.", 3840, 4110, "stable", 0.4),
  mk("Bucheki Mandi", "Bucheki", "Nankana Sahib", "Punjab", 31.18, 73.39, ["Wheat", "Rice"], "5:00 AM", "6:00 PM", 126, 233, "open", "Bucheki, in Nankana Sahib district, is known for its many rice mills and is a key aromatic rice trading town supplying both domestic and export markets.", 3880, 4160, "up", 2.0),
  mk("Lahore Mandi", "Lahore", "Lahore", "Punjab", 31.5497, 74.3436, ["Wheat", "Rice"], "5:30 AM", "6:30 PM", 136, 183, "open", "Lahore's wholesale markets are among the largest in Punjab, serving as a major distribution point for grain, fruit and vegetables grown across the province.", 3940, 4240, "up", 2.8),
  mk("Hasilpur Mandi", "Hasilpur", "Hasilpur", "Punjab", 29.6981, 72.5442, ["Wheat", "Maize"], "6:00 AM", "6:30 PM", 218, 145, "open", "Hasilpur, in Bahawalpur district, is a major dairy-collection hub for Pakistan's milk processing industry as well as a cotton market town.", 3850, 4120, "up", 1.4),
  mk("Kahror Pacca Mandi", "Kahror Pacca", "Kahror Pacca", "Punjab", 29.6213, 71.9125, ["Wheat", "Cotton", "Sugarcane"], "6:00 AM", "6:30 PM", 230, 97, "closed", "Kahror Pacca, in Lodhran district, supports cotton and mango cultivation typical of the Multan-Bahawalpur fruit and fibre belt.", 3855, 4130, "down", -0.7),
  mk("Ellahabad Mandi", "Ellahabad", "Ellahabad", "Punjab", 29.85, 71.9, ["Wheat", "Livestock"], "5:00 AM", "6:30 PM", 42, 149, "open", "Ellahabad is a smaller agricultural market town in southern Punjab's cotton and wheat growing belt.", 3845, 4115, "up", 1.2),
  mk("Haveli Lakha Mandi", "Haveli Lakha", "Haveli Lakha", "Punjab", 30.451, 73.6937, ["Wheat", "Rice", "Sugarcane"], "5:30 AM", "6:00 PM", 109, 156, "open", "Haveli Lakha, on the Okara-Pakpattan border, is a wheat and cotton trading town within Punjab's historic canal colonies.", 3860, 4135, "up", 1.8),
  mk("Qabula Mandi", "Qabula", "Qabula", "Punjab", 30.1481, 73.0728, ["Wheat", "Maize"], "5:00 AM", "6:30 PM", 288, 215, "open", "Qaboola (Qabula), in Pakpattan district, is a historic riverside town on the Sutlej supporting wheat and cotton farming.", 3850, 4120, "up", 1.7),
  mk("Quetta Mandi", "Quetta", "Quetta", "Balochistan", 30.1798, 66.975, ["Wheat", "Cotton"], "6:00 AM", "6:30 PM", 95, 82, "closed", "Quetta's highland climate makes it Pakistan's premier centre for apples, grapes, apricots and other temperate fruit, with its fruit and dry-fruit markets serving buyers from across the country.", 3950, 4260, "up", 2.2),
  mk("Mansehra Mandi", "Mansehra", "Mansehra", "Khyber Pakhtunkhwa", 34.332, 73.2028, ["Wheat", "Rice", "Sugarcane"], "5:30 AM", "7:00 PM", 49, 36, "open", "Mansehra, in the Hazara hills, is known for maize and wheat farming as well as honey production from its forested valleys.", 3890, 4180, "up", 1.9),
  mk("Dera Ismail Khan Mandi", "Dera Ismail Khan", "Dera Ismail Khan", "Khyber Pakhtunkhwa", 31.8314, 70.9017, ["Wheat", "Maize"], "5:30 AM", "6:30 PM", 118, 225, "open", "Dera Ismail Khan, in southern KPK's plains, is a wheat and sugarcane producing district along the Indus River.", 3840, 4110, "stable", 0.5),
  mk("Buner Mandi", "Buner", "Buner", "Khyber Pakhtunkhwa", 34.6667, 72.4333, ["Wheat", "Sugarcane"], "6:00 AM", "7:00 PM", 164, 31, "open", "Buner's terraced hillsides support maize and wheat farming, and the district is known regionally for its natural honey production.", 3860, 4140, "up", 1.6),
];

export const PROVINCES: ProvinceInfo[] = [
  {
    name: "Punjab",
    short: "Punjab",
    outlines: [
      [[27.7923, 71.1251], [27.7172, 70.7577], [28.0355, 70.5098], [27.8551, 70.1808], [27.901, 70.0485], [28.4333, 69.6917], [28.4966, 69.2948], [29.2914, 69.7361], [29.4313, 69.528], [29.6515, 69.5584], [29.8089, 69.806], [30.2325, 70.0414], [30.2982, 69.9201], [30.7172, 70.0701], [30.8435, 70.2581], [31.1541, 70.2271], [31.3251, 70.5356], [31.3009, 70.772], [32.1391, 71.118], [32.3701, 71.3457], [32.508, 71.3619], [32.4962, 71.2504], [32.7743, 71.1206], [32.9619, 71.1911], [33.0405, 71.5059], [33.216, 71.4084], [33.2191, 71.5708], [33.0506, 71.7101], [33.3574, 71.7374], [33.9939, 72.4168], [33.8616, 72.6693], [33.9297, 72.7946], [33.6099, 72.8278], [33.6641, 73.0575], [33.4942, 73.1632], [33.7034, 73.3338], [33.8033, 73.1452], [34.0244, 73.502], [33.0943, 73.5967], [32.786, 74.3115], [32.8397, 74.697], [32.4931, 74.6867], [32.48, 75.0826], [32.227, 75.3593], [31.8288, 74.5564], [31.46, 74.6421], [31.1385, 74.5046], [31.0722, 74.6832], [30.463, 73.9353], [30.1857, 73.958], [29.9379, 73.3914], [29.0272, 72.9417], [28.7639, 72.3847], [27.9574, 71.8974], [27.7923, 71.1251]],
    ],
    fill: "#DCFCE7",
    fillActive: "#4ADE80",
  },
  {
    name: "Sindh",
    short: "Sindh",
    outlines: [
      [[23.9632, 68.5471], [23.8499, 68.1335], [24.0449, 68.0529], [24.064, 67.4104], [24.2349, 67.3574], [24.1901, 67.4607], [24.3713, 67.5321], [24.326, 67.4243], [24.4226, 67.4721], [24.5757, 67.2971], [24.639, 67.4446], [24.7693, 67.4301], [24.8379, 66.6532], [25.1018, 66.9976], [25.8407, 67.463], [26.6858, 67.1583], [27.3003, 67.1442], [27.8918, 67.4241], [28.011, 67.9237], [28.4393, 68.4657], [28.4785, 69.5916], [28.3546, 69.7846], [27.9494, 69.9644], [27.8551, 70.1808], [27.1655, 69.5781], [26.8062, 69.4837], [26.5922, 69.8154], [26.5507, 70.1677], [25.9443, 70.0961], [25.7013, 70.2796], [25.6972, 70.666], [25.3893, 70.6742], [24.6807, 71.1071], [24.4422, 71.0076], [24.4018, 71.1318], [24.2209, 70.7258], [24.2523, 70.5742], [24.4186, 70.5601], [24.1651, 69.9787], [24.2778, 69.6007], [24.1959, 68.8875], [24.3084, 68.8264], [23.962, 68.7492], [23.9632, 68.5471]],
    ],
    fill: "#FEE2E2",
    fillActive: "#FCA5A5",
  },
  {
    name: "Khyber Pakhtunkhwa",
    short: "KPK",
    outlines: [
      [[31.2459, 70.3697], [31.0668, 70.2167], [31.4735, 70.2053], [31.3121, 69.9941], [31.5231, 69.8745], [31.8848, 69.9218], [31.9818, 69.7841], [32.0728, 69.8862], [31.9299, 69.3184], [32.4614, 69.2407], [32.6619, 69.4649], [32.7691, 69.403], [33.0976, 69.5801], [33.104, 69.9167], [33.3477, 70.342], [33.7265, 70.1545], [33.7668, 69.9732], [34.0225, 69.912], [33.9278, 70.4789], [34.0518, 71.0653], [34.3635, 71.1695], [34.5548, 70.9956], [34.9613, 71.526], [34.7721, 71.799], [34.5454, 71.6507], [34.4521, 71.7162], [34.0913, 71.3904], [33.7498, 71.5026], [33.7682, 71.3405], [33.6192, 71.3377], [33.732, 71.145], [33.5875, 71.1068], [33.5765, 70.7703], [33.4143, 70.5053], [33.1835, 70.873], [33.0115, 70.5085], [32.7961, 70.3781], [32.6275, 70.4713], [32.6185, 70.1867], [32.4731, 70.0887], [32.1656, 70.0555], [31.2459, 70.3697]],
      [[33.8345, 73.2389], [33.7336, 72.9331], [33.9297, 72.7946], [33.8616, 72.6693], [33.9939, 72.4168], [33.3574, 71.7374], [33.0506, 71.7101], [33.2191, 71.5708], [33.216, 71.4084], [33.0405, 71.5059], [32.9743, 71.2099], [32.7743, 71.1206], [32.4962, 71.2504], [32.508, 71.3619], [32.3701, 71.3457], [31.6551, 70.861], [31.4408, 70.8609], [31.3009, 70.772], [31.2459, 70.3697], [32.1656, 70.0555], [32.4343, 70.077], [32.6094, 70.1644], [32.6275, 70.4713], [32.7961, 70.3781], [33.0115, 70.5085], [33.1835, 70.873], [33.4143, 70.5053], [33.5765, 70.7703], [33.5875, 71.1068], [33.732, 71.145], [33.6192, 71.3377], [33.7682, 71.3405], [33.7498, 71.5026], [34.0913, 71.3904], [34.4521, 71.7162], [34.5454, 71.6507], [34.7721, 71.799], [34.9613, 71.526], [35.2066, 71.6893], [35.3118, 71.5669], [35.564, 71.6457], [36.0604, 71.2272], [36.3234, 71.6184], [36.475, 71.652], [36.3994, 71.8573], [36.5055, 71.8321], [36.7535, 72.2414], [36.8484, 72.6316], [36.8898, 73.661], [36.7738, 73.8536], [36.6908, 73.06], [36.5375, 73.0355], [36.2025, 72.5403], [35.8486, 72.5703], [35.8603, 73.0925], [35.6139, 73.2811], [35.5041, 73.8068], [35.2214, 73.7267], [35.1246, 74.1265], [34.5669, 73.6411], [34.555, 73.4427], [34.0416, 73.5131], [33.8345, 73.2389]],
    ],
    fill: "#DBEAFE",
    fillActive: "#93C5FD",
  },
  {
    name: "Balochistan",
    short: "Balochistan",
    outlines: [
      [[25.2946, 64.6749], [25.156, 64.5854], [25.2626, 64.5732], [25.3246, 64.0912], [25.4765, 64.1199], [25.4035, 63.9576], [25.3262, 64.0537], [25.3682, 63.5735], [25.2985, 63.4507], [25.2054, 63.4951], [25.2679, 62.531], [25.094, 62.3746], [25.2199, 62.161], [25.0143, 61.779], [25.1696, 61.7815], [25.1904, 61.6626], [25.2551, 61.7343], [25.1787, 61.5779], [26.2281, 61.8479], [26.3584, 62.2825], [26.5681, 62.4345], [26.6473, 63.1692], [27.1387, 63.3175], [27.2343, 62.783], [28.2771, 62.7919], [28.2551, 62.5923], [28.6402, 61.8042], [29.3487, 61.3726], [29.8375, 60.8994], [29.3764, 62.4816], [29.4764, 63.6649], [29.3617, 64.1394], [29.5718, 64.4876], [29.5347, 65.054], [29.7006, 65.7863], [29.9583, 66.3569], [30.0664, 66.2382], [30.7865, 66.3591], [31.2125, 66.7311], [31.3116, 67.0131], [31.1823, 67.3049], [31.3276, 67.7628], [31.5288, 67.554], [31.5045, 67.7296], [31.8342, 68.1689], [31.714, 68.5371], [31.7632, 68.4331], [31.828, 68.5701], [31.6012, 68.9006], [31.9115, 69.2777], [32.0665, 69.8943], [31.9892, 69.7837], [31.8848, 69.9218], [31.5231, 69.8745], [31.3075, 70.0003], [31.4735, 70.2053], [30.8667, 70.2619], [30.7172, 70.0701], [30.2982, 69.9201], [30.2713, 70.0483], [30.2512, 69.9407], [30.2433, 70.0441], [30.0775, 69.9658], [29.6515, 69.5584], [29.4313, 69.528], [29.3116, 69.7329], [29.1724, 69.7027], [28.5699, 69.2618], [28.457, 69.3487], [28.4393, 68.4657], [28.011, 67.9237], [27.9026, 67.4373], [27.6907, 67.2911], [27.3003, 67.1442], [26.7078, 67.1546], [25.8407, 67.463], [25.0737, 66.9754], [24.9076, 66.6874], [25.1857, 66.7465], [25.5115, 66.5426], [25.5974, 66.3429], [25.549, 66.2457], [25.491, 66.524], [25.4026, 66.5137], [25.2946, 64.6749]],
    ],
    fill: "#FFEDD5",
    fillActive: "#FDBA74",
  },
  {
    name: "Islamabad Capital Territory",
    short: "Islamabad",
    outlines: [
      [[33.8033, 73.1452], [33.7034, 73.3338], [33.4942, 73.1632], [33.6641, 73.0575], [33.5762, 72.8585], [33.6802, 72.7827], [33.8033, 73.1452]],
    ],
    fill: "#E2E8F0",
    fillActive: "#CBD5E1",
  },
  {
    name: "Gilgit-Baltistan",
    short: "Gilgit-Baltistan",
    outlines: [
      [[34.9074, 75.2454], [34.7972, 75.0655], [34.9148, 74.7914], [35.0467, 74.8151], [35.155, 74.6386], [35.0802, 74.4612], [35.2197, 73.7305], [35.5225, 73.7803], [35.6139, 73.2811], [35.8636, 73.0817], [35.8458, 72.575], [36.2269, 72.55], [36.5375, 73.0355], [36.6908, 73.06], [36.7077, 73.8478], [36.9041, 73.6419], [36.8417, 74.1197], [37.097, 74.6767], [36.9346, 74.9224], [37.0199, 75.1469], [36.9428, 75.4019], [36.7216, 75.4545], [36.7688, 75.6525], [36.6205, 75.9189], [36.2273, 76.0556], [36.0693, 75.9463], [35.8334, 76.1752], [35.9178, 76.5673], [35.6741, 76.7523], [35.5283, 77.1867], [35.501, 77.8431], [34.9392, 76.9975], [34.9266, 76.7494], [34.7596, 76.6818], [34.7944, 76.4743], [34.5158, 75.7492], [34.5905, 75.396], [34.9074, 75.2454]],
    ],
    fill: "#E2E8F0",
    fillActive: "#CBD5E1",
  },
  {
    name: "Azad Jammu & Kashmir",
    short: "AJK",
    outlines: [
      [[32.8018, 74.3908], [33.1012, 73.5909], [34.3575, 73.3992], [34.555, 73.4427], [34.5669, 73.6411], [35.1153, 74.098], [35.155, 74.6386], [35.0467, 74.8151], [34.9148, 74.7914], [34.7972, 75.0655], [34.9068, 75.2584], [34.5499, 75.4652], [34.8003, 74.3073], [34.6967, 73.9602], [34.4163, 73.777], [34.2648, 73.9762], [34.0328, 73.8982], [34.0138, 74.2487], [33.8672, 74.2197], [33.7203, 73.9563], [33.4555, 74.1871], [33.2188, 74.0113], [33.0163, 74.3498], [32.8018, 74.3908]],
    ],
    fill: "#E2E8F0",
    fillActive: "#CBD5E1",
  },
];

const MAJOR_HUBS = new Set([
  "Lahore",
  "Faisalabad",
  "Multan",
  "Karachi",
  "Hyderabad",
  "Sukkur",
  "Peshawar",
  "Quetta",
  "Sargodha",
  "Bahawalpur",
  "Sahiwal",
  "Sialkot",
  "Rahim Yar Khan",
  "Pakpattan",
  "Okara",
  "Jhang",
  "Khanewal",
]);

function labelPriority(m: Mandi): number {
  return MAJOR_HUBS.has(m.city) ? 0 : 1;
}

function labelBudgetForSpan(lonSpan: number): number {
  if (lonSpan > 13) return 0;
  if (lonSpan > 8) return 8;
  if (lonSpan > 4) return 14;
  if (lonSpan > 2) return 22;
  return 36;
}

const FULL_BOUNDS = { latMin: 23.3, latMax: 37.2, lonMin: 60.5, lonMax: 77.9 };
const VIEW_W = 400;
const VIEW_H = 460;

interface ViewBox {
  latMin: number;
  latMax: number;
  lonMin: number;
  lonMax: number;
}

function boundsFromOutline(outlines: [number, number][][], padFraction = 0.35): ViewBox {
  const allPoints = outlines.flat();
  const lats = allPoints.map((p) => p[0]);
  const lons = allPoints.map((p) => p[1]);
  const latMin = Math.min(...lats);
  const latMax = Math.max(...lats);
  const lonMin = Math.min(...lons);
  const lonMax = Math.max(...lons);
  const latPad = (latMax - latMin) * padFraction || 0.5;
  const lonPad = (lonMax - lonMin) * padFraction || 0.5;
  return fitAspect({
    latMin: latMin - latPad,
    latMax: latMax + latPad,
    lonMin: lonMin - lonPad,
    lonMax: lonMax + lonPad,
  });
}

function fitAspect(vb: ViewBox): ViewBox {
  const targetRatio = VIEW_W / VIEW_H;
  const latSpan = vb.latMax - vb.latMin;
  const lonSpan = vb.lonMax - vb.lonMin;
  const centerLat = (vb.latMin + vb.latMax) / 2;
  const centerLon = (vb.lonMin + vb.lonMax) / 2;
  const kmPerDegLat = 111;
  const kmPerDegLon = 111 * Math.cos((centerLat * Math.PI) / 180);
  const currentRatio = (lonSpan * kmPerDegLon) / (latSpan * kmPerDegLat);
  if (currentRatio > targetRatio) {
    const neededLatSpan = (lonSpan * kmPerDegLon) / (targetRatio * kmPerDegLat);
    return {
      latMin: centerLat - neededLatSpan / 2,
      latMax: centerLat + neededLatSpan / 2,
      lonMin: vb.lonMin,
      lonMax: vb.lonMax,
    };
  } else {
    const neededLonSpan = (targetRatio * latSpan * kmPerDegLat) / kmPerDegLon;
    return {
      latMin: vb.latMin,
      latMax: vb.latMax,
      lonMin: centerLon - neededLonSpan / 2,
      lonMax: centerLon + neededLonSpan / 2,
    };
  }
}

function project(lat: number, lon: number, vb: ViewBox): { x: number; y: number } {
  const x = ((lon - vb.lonMin) / (vb.lonMax - vb.lonMin)) * VIEW_W;
  const y = ((vb.latMax - lat) / (vb.latMax - vb.latMin)) * VIEW_H;
  return { x, y };
}

function polygonPoints(outline: [number, number][], vb: ViewBox): string {
  return outline.map(([lat, lon]) => {
    const { x, y } = project(lat, lon, vb);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

interface MarkerPoint {
  mandi: Mandi;
  x: number;
  y: number;
}

interface Cluster {
  id: string;
  x: number;
  y: number;
  mandis: Mandi[];
  province: string;
}

function clusterMarkers(points: MarkerPoint[], thresholdPx: number): Cluster[] {
  const remaining = [...points];
  const clusters: Cluster[] = [];
  while (remaining.length > 0) {
    const seed = remaining.shift()!;
    const group: MarkerPoint[] = [seed];
    for (let i = remaining.length - 1; i >= 0; i--) {
      const p = remaining[i];
      const dist = Math.hypot(p.x - seed.x, p.y - seed.y);
      if (dist < thresholdPx) {
        group.push(p);
        remaining.splice(i, 1);
      }
    }
    const avgX = group.reduce((s, g) => s + g.x, 0) / group.length;
    const avgY = group.reduce((s, g) => s + g.y, 0) / group.length;
    clusters.push({
      id: `cluster-${group.map((g) => g.mandi.id).join("-")}`,
      x: avgX,
      y: avgY,
      mandis: group.map((g) => g.mandi),
      province: group[0].mandi.province,
    });
  }
  return clusters;
}

type ViewLevel = "country" | "province" | "mandi";

interface AppView {
  level: ViewLevel;
  province: ProvinceInfo | null;
  mandi: Mandi | null;
}

const GREEN_DARK = "#166534";
const GREEN_MED = "#16A34A";

// Helpers for realistic graph point calculation in the map bottom sheet
function getMapGraphData(
  minVal: number,
  maxVal: number,
  trend: "up" | "down" | "flat" | "stable",
  timeframe: "24h" | "72h" | "7d" | "30d",
  lang: string
) {
  const diff = Math.max(maxVal - minVal, 50);
  let pattern: number[];
  if (trend === "up") {
    // 7 points matching the user screenshot curve: starts low, slight rise, slight dip at 12:00, then climbs steadily
    pattern = [0.12, 0.42, 0.35, 0.52, 0.76, 0.78, 0.96];
  } else if (trend === "down") {
    pattern = [0.94, 0.78, 0.68, 0.52, 0.32, 0.28, 0.08];
  } else {
    pattern = [0.45, 0.54, 0.44, 0.56, 0.48, 0.52, 0.50];
  }

  const tfShift =
    timeframe === "24h"
      ? [0, 0, 0, 0, 0, 0, 0]
      : timeframe === "72h"
      ? [-0.02, 0.03, -0.01, 0.04, -0.01, 0.02, 0]
      : timeframe === "7d"
      ? [0.03, -0.02, 0.04, -0.02, 0.03, -0.01, 0]
      : [-0.04, 0.02, -0.03, 0.05, -0.02, 0.03, 0];

  const points = pattern.map((p, i) => {
    const val = minVal + diff * Math.max(0.02, Math.min(0.98, p + tfShift[i]));
    return Math.round(val);
  });

  if (trend === "up") {
    points[0] = Math.round(minVal + diff * 0.1);
    points[6] = Math.round(maxVal - diff * 0.02);
  } else if (trend === "down") {
    points[0] = Math.round(maxVal - diff * 0.04);
    points[6] = Math.round(minVal + diff * 0.08);
  }

  let xLabels: string[] = [];
  if (timeframe === "24h") {
    xLabels = ["06:00", "09:00", "12:00", "15:00", "18:00", "21:00", lang === "ur" ? "اب" : "Now"];
  } else if (timeframe === "72h") {
    xLabels =
      lang === "ur"
        ? ["دن 1", "12:00", "دن 2", "12:00", "دن 3", "12:00", "اب"]
        : ["Day 1", "12:00", "Day 2", "12:00", "Day 3", "12:00", "Now"];
  } else if (timeframe === "7d") {
    xLabels =
      lang === "ur"
        ? ["پیر", "منگل", "بدھ", "جمعرات", "جمعہ", "ہفتہ", "اتوار"]
        : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  } else {
    xLabels =
      lang === "ur"
        ? ["یکم", "5ویں", "10ویں", "15ویں", "20ویں", "25ویں", "آج"]
        : ["1st", "5th", "10th", "15th", "20th", "25th", "Today"];
  }

  const yMinBound = Math.floor((minVal - diff * 0.1) / 50) * 50;
  const yMaxBound = Math.ceil((maxVal + diff * 0.1) / 50) * 50;
  const yMidVal = Math.round((yMinBound + yMaxBound) / 2);

  const fmtK = (v: number) =>
    v >= 1000 ? (v / 1000).toFixed(1) + "k" : String(Math.round(v));

  const yLabels = [
    { label: fmtK(yMaxBound), val: yMaxBound },
    { label: fmtK(yMidVal), val: yMidVal },
    { label: fmtK(yMinBound), val: yMinBound },
  ];

  return { points, xLabels, yLabels, yMinBound, yMaxBound };
}

function getMapArrivalGraphData(
  arrivalStr: string | number | undefined,
  timeframe: "24h" | "72h" | "7d" | "30d",
  lang: string
) {
  const baseArrival = typeof arrivalStr === "number"
    ? arrivalStr
    : parseInt(String(arrivalStr || "5600").replace(/[^0-9]/g, ""), 10) || 5600;

  const minArrival = Math.round(baseArrival * 0.88);
  const maxArrival = Math.round(baseArrival * 1.12);
  const diff = maxArrival - minArrival;

  const pattern = [0.18, 0.44, 0.36, 0.58, 0.74, 0.80, 0.96];
  const points = pattern.map((p) => Math.round(minArrival + diff * p));

  let xLabels = ["06:00", "09:00", "12:00", "15:00", "18:00", "21:00", lang === "ur" ? "اب" : "Now"];
  if (timeframe === "72h") {
    xLabels = lang === "ur" ? ["دن 1", "12:00", "دن 2", "12:00", "دن 3", "12:00", "اب"] : ["Day 1", "12:00", "Day 2", "12:00", "Day 3", "12:00", "Now"];
  } else if (timeframe === "7d") {
    xLabels = lang === "ur" ? ["پیر", "منگل", "بدھ", "جمعرات", "جمعہ", "ہفتہ", "اتوار"] : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  } else if (timeframe === "30d") {
    xLabels = lang === "ur" ? ["یکم", "5ویں", "10ویں", "15ویں", "20ویں", "25ویں", "آج"] : ["1st", "5th", "10th", "15th", "20th", "25th", "Today"];
  }

  const yMinBound = Math.floor(minArrival * 0.95);
  const yMaxBound = Math.ceil(maxArrival * 1.05);
  const yMidVal = Math.round((yMinBound + yMaxBound) / 2);

  const fmtK = (v: number) => v >= 1000 ? (v / 1000).toFixed(1) + "k" : String(Math.round(v));
  const yLabels = [
    { label: fmtK(yMaxBound), val: yMaxBound },
    { label: fmtK(yMidVal), val: yMidVal },
    { label: fmtK(yMinBound), val: yMinBound },
  ];

  return { points, minArrival, maxArrival, xLabels, yLabels, yMinBound, yMaxBound };
}

export interface ZaraiMandiMapProps {
  onClose?: () => void;
  initialMandiName?: string;
  initialProvinceName?: string;
  activeCommodity?: string;
  rateInfo?: {
    cropName?: string;
    mandiName?: string;
    minPrice?: number;
    maxPrice?: number;
    rateType?: string;
    trend?: "up" | "down" | "flat" | "stable";
    trendPct?: number;
    arrival?: string;
    quality?: string;
    variety?: string;
    color?: string;
    condition?: string;
    spec?: string;
  };
  lang?: "ur" | "en";
  urduFont?: string;
}

export default function ZaraiMandiMap({
  onClose,
  initialMandiName = "Pakpattan Mandi",
  initialProvinceName = "Punjab",
  activeCommodity = "Wheat",
  rateInfo,
  lang = "en",
  urduFont,
}: ZaraiMandiMapProps) {
  const [view, setView] = useState<AppView>({
    level: "country",
    province: null,
    mandi: null,
  });
  const [viewBox, setViewBox] = useState<ViewBox>(() => fitAspect(FULL_BOUNDS));
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [graphMode, setGraphMode] = useState<"price" | "arrival">("price");
  const [timeframe, setTimeframe] = useState<"24h" | "72h" | "7d" | "30d">("24h");
  const [showWiki, setShowWiki] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // Commodity context filtering: only mandis with activeCommodity (e.g. Wheat) are shown
  const visibleCropMandis = useMemo(() => {
    const crop = activeCommodity.toLowerCase();
    return MANDI_DATA.filter((m) =>
      m.commodities.some((c) => c.toLowerCase() === crop || c.toLowerCase().includes(crop))
    );
  }, [activeCommodity]);

  const selectedMandi = view.mandi;

  const visibleMandis = useMemo(() => {
    if (selectedMandi) return visibleCropMandis;
    if (view.level === "province" && view.province) {
      return visibleCropMandis.filter((m) => m.province === view.province!.name);
    }
    return visibleCropMandis;
  }, [visibleCropMandis, view.level, view.province, selectedMandi]);

  /* ---------------- animated map transitions ---------------- */

  const viewBoxRef = useRef(viewBox);
  useEffect(() => {
    viewBoxRef.current = viewBox;
  }, [viewBox]);

  const animRef = useRef<number | null>(null);

  const animateToViewBox = useCallback((target: ViewBox, duration = 480) => {
    if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    const start = viewBoxRef.current;
    const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
    const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const e = ease(p);
      setViewBox({
        latMin: start.latMin + (target.latMin - start.latMin) * e,
        latMax: start.latMax + (target.latMax - start.latMax) * e,
        lonMin: start.lonMin + (target.lonMin - start.lonMin) * e,
        lonMax: start.lonMax + (target.lonMax - start.lonMax) * e,
      });
      if (p < 1) {
        animRef.current = requestAnimationFrame(step);
      } else {
        animRef.current = null;
      }
    };
    animRef.current = requestAnimationFrame(step);
  }, []);

  const goCountry = useCallback(() => {
    setView({ level: "country", province: null, mandi: null });
    animateToViewBox(fitAspect(FULL_BOUNDS));
    setShowWiki(false);
  }, [animateToViewBox]);

  const goProvince = useCallback(
    (province: ProvinceInfo) => {
      setView({ level: "province", province, mandi: null });
      animateToViewBox(boundsFromOutline(province.outlines));
      setShowWiki(false);
    },
    [animateToViewBox]
  );

  const goMandi = useCallback(
    (mandi: Mandi) => {
      const province = PROVINCES.find((p) => p.name === mandi.province) ?? null;
      setView({ level: "mandi", province, mandi });

      const vb = viewBoxRef.current;
      let latSpan = vb.latMax - vb.latMin;
      let lonSpan = vb.lonMax - vb.lonMin;
      const targetSpan = 3.5;
      if (latSpan > targetSpan) {
        latSpan = targetSpan;
        lonSpan = targetSpan * 1.2;
      }

      animateToViewBox({
        latMin: mandi.latitude - latSpan / 2,
        latMax: mandi.latitude + latSpan / 2,
        lonMin: mandi.longitude - lonSpan / 2,
        lonMax: mandi.longitude + lonSpan / 2,
      });

      setShowWiki(false);
      setSearchQuery("");
      setSearchFocused(false);
    },
    [animateToViewBox]
  );

  useEffect(() => {
    if (initialMandiName) {
      const found = visibleCropMandis.find(
        (m) =>
          m.name.toLowerCase().includes(initialMandiName.toLowerCase()) ||
          m.city.toLowerCase().includes(initialMandiName.toLowerCase())
      );
      if (found) {
        goMandi(found);
      }
    }
  }, [initialMandiName, visibleCropMandis, goMandi]);

  /* ---------------- gestures ---------------- */

  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const dragRef = useRef<{ id: number; lastX: number; lastY: number } | null>(null);
  const movedRef = useRef(false);

  const getScale = useCallback(() => {
    const el = svgRef.current;
    if (!el) return 1;
    const r = el.getBoundingClientRect();
    return Math.min(r.width / VIEW_W, r.height / VIEW_H) || 1;
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    movedRef.current = false;
    if (pointersRef.current.size === 1) {
      dragRef.current = { id: e.pointerId, lastX: e.clientX, lastY: e.clientY };
    }
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const d = dragRef.current;
      if (!d || d.id !== e.pointerId) return;
      const dx = e.clientX - d.lastX;
      const dy = e.clientY - d.lastY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) movedRef.current = true;
      d.lastX = e.clientX;
      d.lastY = e.clientY;

      const s = getScale();
      const vb = viewBoxRef.current;
      const lonPerPx = (vb.lonMax - vb.lonMin) / VIEW_W / s;
      const latPerPx = (vb.latMax - vb.latMin) / VIEW_H / s;
      setViewBox((prev) => ({
        latMin: prev.latMin + dy * latPerPx,
        latMax: prev.latMax + dy * latPerPx,
        lonMin: prev.lonMin - dx * lonPerPx,
        lonMax: prev.lonMax - dx * lonPerPx,
      }));
    },
    [getScale]
  );

  const handlePointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    pointersRef.current.delete(e.pointerId);
    dragRef.current = null;
  }, []);

  const zoomBy = useCallback(
    (factor: number) => {
      const vb = viewBoxRef.current;
      const centerLat = (vb.latMin + vb.latMax) / 2;
      const centerLon = (vb.lonMin + vb.lonMax) / 2;
      const latSpan = (vb.latMax - vb.latMin) * factor;
      const lonSpan = (vb.lonMax - vb.lonMin) * factor;
      animateToViewBox({
        latMin: centerLat - latSpan / 2,
        latMax: centerLat + latSpan / 2,
        lonMin: centerLon - lonSpan / 2,
        lonMax: centerLon + lonSpan / 2,
      });
    },
    [animateToViewBox]
  );

  const points: MarkerPoint[] = useMemo(
    () =>
      visibleMandis.map((m) => {
        const { x, y } = project(m.latitude, m.longitude, viewBox);
        return { mandi: m, x, y };
      }),
    [visibleMandis, viewBox]
  );

  const lonSpan = viewBox.lonMax - viewBox.lonMin;

  const clusters = useMemo(() => {
    if (selectedMandi) {
      return points.map((p) => ({
        id: `single-${p.mandi.id}`,
        x: p.x,
        y: p.y,
        mandis: [p.mandi],
        province: p.mandi.province,
      }));
    }
    const threshold = lonSpan > 12 ? 16 : lonSpan > 6 ? 10 : 6;
    return clusterMarkers(points, threshold);
  }, [points, lonSpan, selectedMandi]);

  const labels = useMemo(() => {
    const singles = clusters.filter((c) => c.mandis.length === 1);
    const budget = labelBudgetForSpan(lonSpan);
    if (budget === 0 && !selectedMandi) return [];

    const candidates = [...singles]
      .sort((a, b) => {
        if (selectedMandi) {
          if (a.mandis[0].id === selectedMandi.id) return -1;
          if (b.mandis[0].id === selectedMandi.id) return 1;
        }
        return labelPriority(a.mandis[0]) - labelPriority(b.mandis[0]);
      })
      .slice(0, selectedMandi ? 10 : budget);

    return candidates.map((c) => {
      const m = c.mandis[0];
      const isSel = selectedMandi?.id === m.id;
      return {
        key: m.id,
        x: c.x + (isSel ? 9 : 6),
        y: c.y - (isSel ? 10 : 6),
        text: isSel ? `${m.name}` : m.city,
        selected: isSel,
      };
    });
  }, [clusters, lonSpan, selectedMandi]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return visibleCropMandis.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.city.toLowerCase().includes(q) ||
        m.district.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [searchQuery, visibleCropMandis]);

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-[#F4FAF7] select-none font-sans rounded-[26px]">
      {/* ── Compact Top Controls & Floating Search ── */}
      <div className="relative z-30 px-3.5 pt-3 pb-1.5 flex items-center justify-between gap-2.5 bg-white/90 backdrop-blur-md border-b border-emerald-100/80">
        <div className="flex-1 relative">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F0FDF4] border border-emerald-200">
            <Search size={15} color="#166534" className="flex-shrink-0" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              placeholder={lang === "ur" ? `پاکستان میں ${activeCommodity} کی منڈیاں تلاش کریں` : `Search ${activeCommodity} mandis in Pakistan...`}
              className="w-full bg-transparent text-[13px] text-emerald-950 font-medium outline-none placeholder:text-emerald-700/50"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSearchFocused(false);
                }}
                className="text-emerald-700/60 hover:text-emerald-900"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {searchFocused && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-emerald-100 overflow-hidden z-40 max-h-48 overflow-y-auto">
              {searchResults.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    goMandi(m);
                    setSearchQuery("");
                    setSearchFocused(false);
                  }}
                  className="w-full px-3 py-2 flex items-center gap-2.5 text-left hover:bg-[#F0FDF4] transition-colors border-b border-emerald-50 last:border-none"
                >
                  <MapPin size={13} className="text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="text-[12.5px] font-bold text-emerald-950">{m.name}</p>
                    <p className="text-[10px] text-emerald-700">{m.city}, {m.province}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Commodity Badge Pill (No Emoji) */}
        <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 text-white shadow-sm font-bold">
          <span className="text-[12px] tracking-tight">{activeCommodity}</span>
          <span className="text-[11px] opacity-85 font-semibold">({visibleCropMandis.length})</span>
        </div>
      </div>

      {/* ── Vector Map Area ── */}
      <div className="relative flex-1 min-h-0 bg-[#E8F5EE]/40 overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full cursor-grab active:cursor-grabbing"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onClick={() => {
            if (!movedRef.current) {
              setSheetExpanded(false);
            }
          }}
        >
          <rect x={0} y={0} width={VIEW_W} height={VIEW_H} fill="#F0FAF5" />

          {/* Provinces */}
          {PROVINCES.map((p) => {
            const isActive = view.province?.name === p.name;
            return (
              <g key={p.name}>
                {p.outlines.map((ring, ringIdx) => (
                  <polygon
                    key={`${p.name}-${ringIdx}`}
                    points={polygonPoints(ring, viewBox)}
                    fill={isActive ? p.fillActive : p.fill}
                    stroke="#FFFFFF"
                    strokeWidth={0.8}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!movedRef.current && view.level === "country") {
                        goProvince(p);
                      }
                    }}
                    style={{ cursor: view.level === "country" ? "pointer" : "default" }}
                  />
                ))}
              </g>
            );
          })}

          {/* Mandi Pins / Nodes */}
          {clusters.map((c) => {
            const isCluster = c.mandis.length > 1;
            if (isCluster) {
              const r = 9 + Math.min(c.mandis.length, 16) * 0.4;
              return (
                <g
                  key={c.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!movedRef.current) {
                      const lats = c.mandis.map((m) => m.latitude);
                      const lons = c.mandis.map((m) => m.longitude);
                      animateToViewBox(
                        fitAspect({
                          latMin: Math.min(...lats) - 0.4,
                          latMax: Math.max(...lats) + 0.4,
                          lonMin: Math.min(...lons) - 0.4,
                          lonMax: Math.max(...lons) + 0.4,
                        })
                      );
                    }
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <circle cx={c.x} cy={c.y} r={r} fill="#16A34A" fillOpacity={0.88} stroke="white" strokeWidth={2} />
                  <text x={c.x} y={c.y + 4} textAnchor="middle" fontSize={10} fontWeight={700} fill="white">
                    {c.mandis.length}
                  </text>
                </g>
              );
            }

            const m = c.mandis[0];
            const isSel = selectedMandi?.id === m.id;

            return (
              <g
                key={c.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!movedRef.current) {
                    goMandi(m);
                  }
                }}
                style={{ cursor: "pointer" }}
              >
                {isSel ? (
                  <>
                    {/* Subtle continuous ripple-wave animation around selected pin (small radius) */}
                    <g pointerEvents="none">
                      {/* Ground contact shadow */}
                      <ellipse cx={c.x} cy={c.y + 0.5} rx={4.5} ry={1.6} fill="#052B20" fillOpacity={0.28} />

                      {/* Small radius ripple wave 1 */}
                      <circle cx={c.x} cy={c.y} r={3} fill="none" stroke="#087F63" strokeWidth={1.2}>
                        <animate attributeName="r" values="2.5;7.5" dur="1.8s" repeatCount="indefinite" />
                        <animate attributeName="stroke-opacity" values="0.75;0" dur="1.8s" repeatCount="indefinite" />
                        <animate attributeName="stroke-width" values="1.2;0.3" dur="1.8s" repeatCount="indefinite" />
                      </circle>

                      {/* Small radius ripple wave 2 */}
                      <circle cx={c.x} cy={c.y} r={2} fill="#087F63">
                        <animate attributeName="r" values="2;5.5" dur="1.8s" begin="0.9s" repeatCount="indefinite" />
                        <animate attributeName="fill-opacity" values="0.35;0" dur="1.8s" begin="0.9s" repeatCount="indefinite" />
                      </circle>
                    </g>

                    {/* Distinct Selected Zarai Mandi Pin Marker */}
                    <g transform={`translate(${c.x}, ${c.y})`}>
                      <defs>
                        <filter id={`pinGlow-${m.id}`} x="-40%" y="-40%" width="180%" height="180%">
                          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#044D3C" floodOpacity="0.45" />
                        </filter>
                      </defs>
                      <path
                        d="M 0 0 C -2.2 -2.8 -6.5 -7.2 -6.5 -11.5 C -6.5 -15.2 -3.6 -18 0 -18 C 3.6 -18 6.5 -15.2 6.5 -11.5 C 6.5 -7.2 2.2 -2.8 0 0 Z"
                        fill="#087F63"
                        stroke="#FFFFFF"
                        strokeWidth={1.5}
                        filter={`url(#pinGlow-${m.id})`}
                      />
                      <circle cx={0} cy={-11.5} r={2.6} fill="#FFFFFF" />
                      <circle cx={0} cy={-11.5} r={1.3} fill="#087F63" />
                    </g>
                  </>
                ) : (
                  <>
                    {/* Normal Unselected Zarai Mandi Location Pin */}
                    <ellipse cx={c.x} cy={c.y + 0.4} rx={2.8} ry={1} fill="#052B20" fillOpacity={0.16} />
                    <g transform={`translate(${c.x}, ${c.y})`}>
                      <path
                        d="M 0 0 C -1.4 -1.8 -4.2 -4.8 -4.2 -7.5 C -4.2 -9.8 -2.3 -11.5 0 -11.5 C 2.3 -11.5 4.2 -9.8 4.2 -7.5 C 4.2 -4.8 1.4 -1.8 0 0 Z"
                        fill="#16A34A"
                        stroke="#FFFFFF"
                        strokeWidth={0.9}
                      />
                      <circle cx={0} cy={-7.5} r={1.4} fill="#FFFFFF" />
                    </g>
                  </>
                )}
              </g>
            );
          })}

          {/* Collision-free Mandi Labels */}
          {labels.map((l) => (
            <g key={l.key} pointerEvents="none">
              {l.selected ? (
                <>
                  <rect
                    x={l.x - 2}
                    y={l.y - 8}
                    width={l.text.length * 6 + 14}
                    height={16}
                    rx={8}
                    fill="#087F63"
                    stroke="#FFFFFF"
                    strokeWidth={1}
                    filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
                  />
                  <text
                    x={l.x + 5}
                    y={l.y + 3.5}
                    fontSize={9}
                    fontWeight={800}
                    fill="#FFFFFF"
                  >
                    {l.text}
                  </text>
                </>
              ) : (
                <text
                  x={l.x}
                  y={l.y + 2}
                  fontSize={8}
                  fontWeight={700}
                  fill="#183B34"
                  stroke="#FFFFFF"
                  strokeWidth={2.2}
                  paintOrder="stroke"
                >
                  {l.text}
                </text>
              )}
            </g>
          ))}
        </svg>

        {/* Floating Zoom / Reset FABs */}
        <div className="absolute right-3 top-3 flex flex-col gap-1.5 z-20">
          <button
            onClick={goCountry}
            aria-label="Overview"
            className="w-8 h-8 rounded-full bg-white shadow-md border border-emerald-100 flex items-center justify-center text-emerald-800 hover:bg-emerald-50 active:scale-90 transition-transform"
            title="Overview"
          >
            <Layers size={14} />
          </button>
          <button
            onClick={() => zoomBy(0.65)}
            aria-label="Zoom in"
            className="w-8 h-8 rounded-full bg-white shadow-md border border-emerald-100 flex items-center justify-center text-emerald-800 hover:bg-emerald-50 active:scale-90 transition-transform"
          >
            <Plus size={14} />
          </button>
          <button
            onClick={() => zoomBy(1.5)}
            aria-label="Zoom out"
            className="w-8 h-8 rounded-full bg-white shadow-md border border-emerald-100 flex items-center justify-center text-emerald-800 hover:bg-emerald-50 active:scale-90 transition-transform"
          >
            <Minus size={14} />
          </button>
        </div>
      </div>

      {/* ── Consistent Table Row & Dedicated Interactive Graph Card ── */}
      {selectedMandi && (() => {
        const isPakpattan = selectedMandi.name.toLowerCase().includes("pakpattan") || selectedMandi.city.toLowerCase().includes("pakpattan");
        const stationName = lang === "ur"
          ? (selectedMandi.city === "Pakpattan" ? "پاکپتن" : selectedMandi.city)
          : (selectedMandi.city || selectedMandi.name.replace(" Mandi", "").replace(" منڈی", ""));
        const mandiTitle = lang === "ur"
          ? (selectedMandi.name.includes("منڈی") ? selectedMandi.name : `${selectedMandi.name} منڈی`)
          : (selectedMandi.name.includes("Mandi") ? selectedMandi.name : `${selectedMandi.name} Mandi`);

        const minVal = rateInfo?.minPrice || (isPakpattan ? 5503 : (selectedMandi.minRate || 3850));
        const maxVal = rateInfo?.maxPrice || (isPakpattan ? 5938 : (selectedMandi.maxRate || 4120));
        const trend = rateInfo?.trend || (isPakpattan ? "up" : (selectedMandi.trend || "up"));
        const trendPct = rateInfo?.trendPct !== undefined
          ? rateInfo.trendPct
          : (isPakpattan ? 0.9 : (selectedMandi.trendPct !== undefined ? selectedMandi.trendPct : 0.9));
        const rateType = rateInfo?.rateType || "Retail";
        const quality = rateInfo?.quality || "New";
        const arrival = rateInfo?.arrival || (isPakpattan ? "5,600" : (selectedMandi.activeListings ? (selectedMandi.activeListings * 70).toLocaleString() : "5,600"));
        const variety = rateInfo?.variety;
        const color = rateInfo?.color;

        const graphData = getMapGraphData(minVal, maxVal, trend as any, timeframe, lang);
        const arrData = getMapArrivalGraphData(arrival, timeframe, lang);

        const W = 350;
        const H = 115;
        const xLeft = 34;
        const xRight = 334;
        const yTop = 12;
        const yBottom = 84;

        const activePoints = graphMode === "price" ? graphData.points : arrData.points;
        const activeMinBound = graphMode === "price" ? graphData.yMinBound : arrData.yMinBound;
        const activeMaxBound = graphMode === "price" ? graphData.yMaxBound : arrData.yMaxBound;
        const activeXLabels = graphMode === "price" ? graphData.xLabels : arrData.xLabels;
        const activeYLabels = graphMode === "price" ? graphData.yLabels : arrData.yLabels;

        const coords = activePoints.map((p, i, arr) => {
          const x = xLeft + (i / (arr.length - 1)) * (xRight - xLeft);
          const y = yBottom - ((p - activeMinBound) / (Math.max(activeMaxBound - activeMinBound, 1))) * (yBottom - yTop);
          return { x, y, val: p };
        });

        const linePath = coords.map((c, i) => (i === 0 ? `M ${c.x} ${c.y}` : `L ${c.x} ${c.y}`)).join(" ");
        const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${yBottom + 8} L ${coords[0].x} ${yBottom + 8} Z`;
        const yMidY = (yTop + yBottom) / 2;

        const isArrival = graphMode === "arrival";
        const chartStrokeColor = isArrival ? "#8B5A2B" : "#10B981";
        const chartGradientId = isArrival ? "mandiMapChartGradientBrown" : "mandiMapChartGradientGreen";
        const chartMaxValColor = isArrival ? "text-[#8B5A2B]" : "text-[#087F63]";

        return (
          <div className="relative z-30 bg-white rounded-t-3xl border-t border-emerald-100 shadow-2xl transition-all duration-300 flex flex-col max-h-[64vh] overflow-y-auto">
            {/* Sheet Expansion Handle */}
            <div className="w-full pt-2 pb-1 flex items-center justify-center pointer-events-none">
              <div className="w-10 h-1 rounded-full bg-emerald-200" />
            </div>

            {/* 1. SINGLE HORIZONTALLY SCROLLABLE TABLE CONTAINER (HEADERS & DATA SCROLL TOGETHER) */}
            <div
              className="w-full overflow-x-auto bg-[#E4F2EC] border-t border-b border-[#D5E2DD] select-none flex-shrink-0"
              style={{
                scrollbarWidth: "none",
                WebkitOverflowScrolling: "touch",
              }}
            >
              <div className="min-w-max flex flex-col">
                {/* Column Header Titles */}
                <div className="bg-[#D8ECE2] border-b border-[#C6DDD1] px-3.5 py-1.5 flex items-center gap-4 text-[9.5px] font-extrabold text-[#325E52] uppercase tracking-wider">
                  <div className="sticky left-0 bg-[#D8ECE2] pr-2 z-10 flex-shrink-0 min-w-[75px]">
                    {lang === "ur" ? "منڈی / شہر" : "Mandi / City"}
                  </div>
                  <div className="flex-shrink-0 whitespace-nowrap min-w-[130px]">
                    {lang === "ur" ? "قیمت کی حد" : "Price Range"}
                  </div>
                  <div className="flex-shrink-0 whitespace-nowrap min-w-[65px]">
                    {lang === "ur" ? "نرخ کی قسم" : "Rate Type"}
                  </div>
                  <div className="flex-shrink-0 whitespace-nowrap min-w-[50px]">
                    {lang === "ur" ? "رجحان" : "Trend"}
                  </div>
                  <div className="flex-shrink-0 whitespace-nowrap min-w-[50px]">
                    {lang === "ur" ? "معیار" : "Condition"}
                  </div>
                  <div className="flex-shrink-0 whitespace-nowrap min-w-[60px]">
                    {lang === "ur" ? "آمد (بوریاں)" : "Arrival"}
                  </div>
                  {variety && (
                    <div className="flex-shrink-0 whitespace-nowrap min-w-[60px]">
                      {lang === "ur" ? "قسم" : "Variety"}
                    </div>
                  )}
                  {color && (
                    <div className="flex-shrink-0 whitespace-nowrap min-w-[60px]">
                      {lang === "ur" ? "رنگ" : "Color"}
                    </div>
                  )}
                </div>

                {/* Data Row Values */}
                <div className="bg-[#E4F2EC] px-3.5 py-2.5 flex items-center gap-4 text-xs font-semibold">
                  {/* Sticky Station column */}
                  <div className="sticky left-0 bg-[#E4F2EC] pr-2 z-10 flex-shrink-0 flex items-center gap-1.5 min-w-[75px]">
                    <span className="font-extrabold text-[#183B34] text-[13.5px]">
                      {stationName}
                    </span>
                  </div>

                  {/* Min – Max Price */}
                  <div className="flex-shrink-0 font-extrabold text-[#087F63] text-[13px] whitespace-nowrap min-w-[130px]">
                    Rs.{minVal.toLocaleString()} – Rs.{maxVal.toLocaleString()}
                  </div>

                  {/* Price Type Badge */}
                  <div className="flex-shrink-0 min-w-[65px]">
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-[#52635F]/10 text-[#52635F] border border-[#52635F]/20">
                      {rateType}
                    </span>
                  </div>

                  {/* Trend */}
                  <div className="flex-shrink-0 font-extrabold text-[#059669] text-xs flex items-center gap-0.5 whitespace-nowrap min-w-[50px]">
                    <span>{trend === "down" ? "▼" : "▲"}</span>
                    <span>{trendPct}%</span>
                  </div>

                  {/* Quality Badge */}
                  <div className="flex-shrink-0 min-w-[50px]">
                    <span className="px-2 py-0.5 rounded-md font-bold text-[10.5px] bg-[#E4F4EC] text-[#0A7F5A]">
                      {quality}
                    </span>
                  </div>

                  {/* Arrival */}
                  <div className="flex-shrink-0 text-[#2F4A43] font-semibold text-xs whitespace-nowrap min-w-[60px]">
                    {arrival}
                  </div>

                  {variety && (
                    <div className="flex-shrink-0 text-[#075E4F] font-bold text-[11px] whitespace-nowrap min-w-[60px]">
                      {variety}
                    </div>
                  )}
                  {color && (
                    <div className="flex-shrink-0 text-[#2F4A43] font-medium text-[11px] whitespace-nowrap min-w-[60px]">
                      {color}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. DEDICATED GRAPH BOX CARD (MATCHING USER SCREENSHOT EXACTLY) */}
            <div className="p-3">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-md p-3.5 flex flex-col gap-2.5">
                {/* Header: Dot + Mandi Title + Toggle (Price / Arrival) + Info/Wiki */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-colors ${
                        isArrival ? "bg-[#8B5A2B]" : "bg-[#10B981]"
                      }`}
                    />
                    <h3 className="font-black text-[15.5px] text-slate-900 truncate">
                      {mandiTitle}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Price / Arrival Segmented Pill Toggle */}
                    <div className="flex items-center bg-[#EAF5F0] p-0.5 rounded-full border border-[#CDE5DC]">
                      <button
                        type="button"
                        onClick={() => {
                          setGraphMode("price");
                          setShowWiki(false);
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-black transition active:scale-95 ${
                          graphMode === "price" && !showWiki
                            ? "bg-[#087F63] text-white shadow-sm"
                            : "text-[#2D5A4C] hover:text-[#087F63]"
                        }`}
                      >
                        {lang === "ur" ? "قیمت" : "Price"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setGraphMode("arrival");
                          setShowWiki(false);
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-black transition active:scale-95 ${
                          graphMode === "arrival" && !showWiki
                            ? "bg-[#8B5A2B] text-white shadow-sm"
                            : "text-[#2D5A4C] hover:text-[#8B5A2B]"
                        }`}
                      >
                        {lang === "ur" ? "آمد" : "Arrival"}
                      </button>
                    </div>

                    {/* Wiki Info Drawer Button */}
                    <button
                      type="button"
                      onClick={() => setShowWiki((prev) => !prev)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition active:scale-95 ${
                        showWiki
                          ? "bg-emerald-700 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                      title={lang === "ur" ? "منڈی کی معلومات" : "Mandi Wiki Information"}
                    >
                      {showWiki ? <X size={13} strokeWidth={2.5} /> : <Info size={13} strokeWidth={2.5} />}
                    </button>
                  </div>
                </div>

                {/* Wiki info drawer if toggled */}
                {showWiki ? (
                  <div className="p-3.5 rounded-xl bg-[#F0FDF4] border border-emerald-200 text-xs text-emerald-950 space-y-2.5 animate-in fade-in duration-200">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                      <BookOpen size={14} className="text-emerald-700" />
                      <span>{lang === "ur" ? `زرعی پروفائل (${selectedMandi.city})` : `About ${selectedMandi.city} Agriculture`}</span>
                    </div>
                    <p className="text-[12px] leading-relaxed text-emerald-950/85 font-medium">
                      {selectedMandi.agriProfile}
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-200/80 text-[11px]">
                      <div>
                        <span className="font-bold text-emerald-800 block">{lang === "ur" ? "اوقات کار" : "Trading Hours"}</span>
                        <span className="font-semibold text-slate-800">{selectedMandi.openingTime} – {selectedMandi.closingTime}</span>
                      </div>
                      <div>
                        <span className="font-bold text-emerald-800 block">{lang === "ur" ? "مارکیٹ کا درجہ" : "Market Status"}</span>
                        <span className="font-bold text-emerald-600">
                          {selectedMandi.status === "open" ? (lang === "ur" ? "● تجارت کے لیے کھلا" : "● Open for Trade") : (lang === "ur" ? "بند ہے" : "Closed")}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Timeframe selector pills: 24H 72H 7D 30D */}
                    <div className="flex items-center justify-between gap-1.5 w-full">
                      {(["24h", "72h", "7d", "30d"] as const).map((tf) => {
                        const isActive = timeframe === tf;
                        const label = tf === "24h" ? "24H" : tf === "72h" ? "72H" : tf === "7d" ? "7D" : "30D";
                        return (
                          <button
                            key={tf}
                            type="button"
                            onClick={() => setTimeframe(tf)}
                            className={`flex-1 py-1 rounded-full text-[11.5px] font-extrabold transition text-center active:scale-95 ${
                              isActive
                                ? (isArrival ? "bg-[#8B5A2B] text-white border border-[#8B5A2B] shadow-sm" : "bg-[#087F63] text-white border border-[#087F63] shadow-sm")
                                : "bg-[#F4FAF7] text-slate-700 border border-[#D5E2DD] hover:bg-slate-50"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Stats Summary Overview Box */}
                    <div className="rounded-xl p-2 px-3 bg-[#F4FAF7] border border-[#D5E2DD] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block leading-none">
                            {graphMode === "price" ? (lang === "ur" ? "کم سے کم ریٹ" : "MIN RATE") : (lang === "ur" ? "کم سے کم آمد" : "MIN ARRIVAL")}
                          </span>
                          <span className="text-xs font-black text-slate-900 block mt-0.5 leading-tight">
                            {graphMode === "price" ? `Rs.${minVal.toLocaleString()}` : `${arrData.minArrival.toLocaleString()} Bags`}
                          </span>
                        </div>
                        <div className="w-[1px] h-5 bg-[#D5E2DD]" />
                        <div>
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block leading-none">
                            {graphMode === "price" ? (lang === "ur" ? "زیادہ سے زیادہ ریٹ" : "MAX RATE") : (lang === "ur" ? "زیادہ سے زیادہ آمد" : "MAX ARRIVAL")}
                          </span>
                          <span className={`text-xs font-black block mt-0.5 leading-tight ${chartMaxValColor}`}>
                            {graphMode === "price" ? `Rs.${maxVal.toLocaleString()}` : `${arrData.maxArrival.toLocaleString()} Bags`}
                          </span>
                        </div>
                      </div>

                      <div className={`px-2.5 py-0.5 rounded-md text-[11px] font-black flex items-center gap-1 ${
                        isArrival ? "bg-[#FDF6F0] text-[#8B5A2B]" : "bg-[#E8F8F0] text-[#059669]"
                      }`}>
                        <span>▲</span>
                        <span>{trendPct}%</span>
                      </div>
                    </div>

                    {/* SVG Line Chart Box */}
                    <div className="rounded-xl border border-slate-100 p-2 bg-white flex flex-col justify-center">
                      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 115, overflow: "visible" }}>
                        <defs>
                          <linearGradient id="mandiMapChartGradientGreen" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                          </linearGradient>
                          <linearGradient id="mandiMapChartGradientBrown" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8B5A2B" stopOpacity="0.28" />
                            <stop offset="100%" stopColor="#8B5A2B" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Dashed Grid Lines & Y-Axis Labels (6.0k, 5.7k, 5.5k) */}
                        {/* Top Grid */}
                        <line x1={xLeft} y1={yTop} x2={xRight} y2={yTop} stroke="#E5E7EB" strokeDasharray="3 3" strokeWidth="1" />
                        <text x={xLeft - 6} y={yTop + 3} textAnchor="end" fill="#9CA3AF" fontSize="7.5" fontWeight="600">
                          {activeYLabels[0]?.label}
                        </text>

                        {/* Mid Grid */}
                        <line x1={xLeft} y1={yMidY} x2={xRight} y2={yMidY} stroke="#E5E7EB" strokeDasharray="3 3" strokeWidth="1" />
                        <text x={xLeft - 6} y={yMidY + 3} textAnchor="end" fill="#9CA3AF" fontSize="7.5" fontWeight="600">
                          {activeYLabels[1]?.label}
                        </text>

                        {/* Bottom Grid */}
                        <line x1={xLeft} y1={yBottom} x2={xRight} y2={yBottom} stroke="#E5E7EB" strokeDasharray="3 3" strokeWidth="1" />
                        <text x={xLeft - 6} y={yBottom + 3} textAnchor="end" fill="#9CA3AF" fontSize="7.5" fontWeight="600">
                          {activeYLabels[2]?.label}
                        </text>

                        {/* Area Fill Under Graph */}
                        <path d={areaPath} fill={`url(#${chartGradientId})`} />

                        {/* Smooth Trend Polyline */}
                        <path d={linePath} fill="none" stroke={chartStrokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                        {/* Circular Data Points (White Center with Colored Stroke) */}
                        {coords.map((c, i) => (
                          <circle key={i} cx={c.x} cy={c.y} r={3.6} fill="#FFFFFF" stroke={chartStrokeColor} strokeWidth="2" />
                        ))}

                        {/* X-Axis Timestamps (06:00, 09:00, 12:00, 15:00, 18:00, 21:00, Now) */}
                        {coords.map((c, i) => (
                          <text key={i} x={c.x} y={102} textAnchor="middle" fill="#9CA3AF" fontSize="7.5" fontWeight="600">
                            {activeXLabels[i]}
                          </text>
                        ))}
                      </svg>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
