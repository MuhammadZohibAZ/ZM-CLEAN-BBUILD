/* ------------------------------------------------------------------ */
/*  Mandi locations, geographic and agricultural profiles             */
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

export function mk(
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
    mk("DG Khan Mandi", "DG Khan", "Dera Ghazi Khan", "Punjab", 30.0561, 70.6349, ["Wheat", "Sugarcane"], "5:00 AM", "7:00 PM", 114, 101, "open", "DG Khan (Dera Ghazi Khan), at the foot of the Sulaiman mountain range, is known for mango orchards and wheat cultivation irrigated by the Indus.", 3850, 4125, "up", 1.7),
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
