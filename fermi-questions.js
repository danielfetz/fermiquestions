// Database of Fermi questions with dates
const fermiQuestions = [
    {
        question: "How many people live outside the country where they were born?",
        answer: 304000000,
        category: "",
        explanation: "",
        hint: "About 20% of Germany's population was born in another country.",
        date: "2025-07-24",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f0f8ff'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%234169e1'%3e🌍%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many people of Jewish faith live in the world?",
        answer: 15800000,
        category: "Religion",
        explanation: "",
        hint: "Appx. 45.5% of the world's Jewish population lives in Israel.",
        date: "2025-07-25",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e✡️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many McDonald's restaurants exist worldwide?",
        answer: 43477,
        category: "Business",
        explanation: "McDonald's operates approximately 43,500 restaurants globally.",
        hint: "There are 13,557 McDonald's restaurants in the US.",
        date: "2025-07-26",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23fef3c7'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23dc2626'%3e🍟%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many new electric cars/plug-in hybrids were sold worldwide in 2024?",
        answer: 17500000,
        category: "",
        explanation: "",
        hint: "62.9M new non-electric cars were sold worldwide in 2023.",
        date: "2025-07-27",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23dcfce7'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%2316a34a'%3e🔋%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many new smartphones were sold worldwide in 2024?",
        answer: 1240000000,
        category: "",
        explanation: "",
        hint: "Xiaomi sold 169 million smartphones in 2024.",
        date: "2025-07-28",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f3f4f6'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e📱%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many cars did Tesla produce in 2024?",
        answer: 1770000,
        category: "",
        explanation: "",
        hint: "In 2018, Tesla produced 255K cars.",
        date: "2025-07-29",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23fef2f2'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23dc2626'%3e🚗%3c/text%3e%3c/svg%3e"
    },
    {
        question: "What percentage of the Earth's surface is land?",
        answer: 29,
        category: "",
        explanation: "",
        hint: "The US covers 1.87% of the Earth's surface.",
        date: "2025-07-30",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23dbeafe'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%232563eb'%3e🌍%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many chickens were slaughtered for meat worldwide in 2023?",
        answer: 76250000000,
        category: "",
        explanation: "",
        hint: "The average meat yield per chicken is 1.66 kg.",
        date: "2025-07-31",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23fffbeb'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23d97706'%3e🐔%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many humans have ever lived (including those currently alive)?",
        answer: 117000000000,
        category: "",
        explanation: "",
        hint: "About half the people who ever lived, lived in the past 2000 years.",
        date: "2025-08-01",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23fef7cd'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23a16207'%3e👥%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many new cars were sold in the United States in 2024?",
        answer: 15900000,
        category: "",
        explanation: "",
        hint: "Around 240 million people hold a valid driver's licence in the US.",
        date: "2025-08-02",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23eff6ff'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%232563eb'%3e🚙%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many veterinarians are there in the United States?",
        answer: 130415,
        category: "",
        explanation: "",
        hint: "There are about 15,000 veterinarians in Australia.",
        date: "2025-08-03",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f0fdf4'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%2316a34a'%3e🐈%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many paying subscribers does Spotify have?",
        answer: 276000000,
        category: "",
        explanation: "",
        hint: "Spotify's revenue in the second quarter of 2025 was 4.2 billion euros.",
        date: "2025-08-04",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f0fdf4'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%2316a34a'%3e🎵%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many iPhones has Apple ever sold?",
        answer: 3000000000,
        category: "",
        explanation: "",
        hint: "In 2024, Apple sold approximately 232.1 million iPhones.",
        date: "2025-08-05",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e📱%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many students are currently enrolled in medical school in the US?",
        answer: 99562,
        category: "",
        explanation: "",
        hint: "The US had 1,01 million active physicians in 2023.",
        date: "2025-08-06",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23fef2f2'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23dc2626'%3e🏥%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many pigs were slaughtered for meat worldwide in 2023?",
        answer: 1510000000,
        category: "",
        explanation: "",
        hint: "The average meat yield per pig is 82 kg (181 lbs).",
        date: "2025-08-07",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23fdf2f8'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23ec4899'%3e🐷%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many passengers did the San Francisco Airport handle in 2024?",
        answer: 52300000,
        category: "",
        explanation: "",
        hint: "1.35M passengers were flown from SFO to Taiwan in 2024.",
        date: "2025-08-08",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f0f8ff'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%234169e1'%3e✈️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many printed books has Amazon sold in the United States in 2024?",
        answer: 308000000,
        category: "",
        explanation: "",
        hint: "In France, retailers sold 440 million print books in 2023.",
        date: "2025-08-09",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f0fdf4'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%2316a34a'%3e📚%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many babies were born worldwide in 2024?",
        answer: 132000000,
        category: "",
        explanation: "",
        hint: "For every person that died in 2024, more than two babies were born.",
        date: "2025-08-10",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23fffbeb'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23d97706'%3e👶%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many air traffic controllers are there in the United States?",
        answer: 14264,
        category: "",
        explanation: "",
        hint: "There are 527 airport traffic control towers in the US.",
        date: "2025-08-11",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e🧭%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many sheep are there in the world?",
        answer: 1266000000,
        category: "",
        explanation: "",
        hint: "A single sheep provides around 4.5 kg of wool per year.",
        date: "2025-08-12",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e🐑%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many dentists work in the United Kingdom?",
        answer: 45580,
        category: "",
        explanation: "",
        hint: "There are 11,976 dental practices in the UK.",
        date: "2025-08-13",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e🦷%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many public school teachers are there in California?",
        answer: 285891,
        category: "",
        explanation: "",
        hint: "There are around 10,000 public schools in California.",
        date: "2025-08-14",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e👩‍🏫%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many weddings took place in the United States in 2022?",
        answer: 2070000,
        category: "",
        explanation: "",
        hint: "673,989 divorces happened in the US in 2022.",
        date: "2025-08-15",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e💍%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many police officers are there across the European Union?",
        answer: 1537588,
        category: "",
        explanation: "",
        hint: "Finland has around 135 police officers per 100,000 inhabitants.",
        date: "2025-08-16",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e🚓%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many Americans who served in World War II were still alive as of 2024?",
        answer: 66143,
        category: "",
        explanation: "",
        hint: "Around 16.4 million Americans served in World War II.",
        date: "2025-08-17",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e🪖%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many airports are there in the US, including small private airstrips?",
        answer: 19482,
        category: "",
        explanation: "",
        hint: "Around 26% of all US airports are open to the public.",
        date: "2025-08-18",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e🛫%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many lawyers are there in the United States?",
        answer: 1322649,
        category: "",
        explanation: "",
        hint: "In 1970, there were 326,000 lawyers in the US.",
        date: "2025-08-19",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e🏛️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many horses are there in the United States?",
        answer: 6700000,
        category: "",
        explanation: "",
        hint: "The horse population has declined by more than two-thirds since it peaked in 1920.",
        date: "2025-08-20",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e🐴%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How much revenue in US dollars did Meta/Facebook make per day in 2024?",
        answer: 450000000,
        category: "",
        explanation: "",
        hint: "In December 2024, Meta's apps reached 3.35 billion people daily.",
        date: "2025-08-21",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e📱%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many passengers fly in and out of US airports every day?",
        answer: 3000000,
        category: "",
        explanation: "",
        hint: "The FAA handles on average more than 44,000 flights per day.",
        date: "2025-08-22",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e✈️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many new cars did Toyota sell globally in 2024?",
        answer: 10200000,
        category: "",
        explanation: "",
        hint: "In 2024, Toyoto sold around 2.33 million cars in the US.",
        date: "2025-08-23",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e🚗️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many golf courses are there in the United States?",
        answer: 15963,
        category: "",
        explanation: "",
        hint: "In 2024, around 28 million people played on a golf course in the US.",
        date: "2025-08-24",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e⛳️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many PCs (desktops and laptops) were sold globally in 2024?",
        answer: 245300000,
        category: "",
        explanation: "",
        hint: "Dell was the third-largest PC vendor in 2024, selling 39.5 million units.",
        date: "2025-08-25",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e💻%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many waiters and waitresses are there in the United States?",
        answer: 2280000,
        category: "",
        explanation: "",
        hint: "Per capita food-away-from-home expenditure was $4,306 in 2024.",
        date: "2025-08-26",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e🍽️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many people worldwide speak English as a native or second language?",
        answer: 1528000000,
        category: "",
        explanation: "",
        hint: "There are around 390 million native English speakers in the world.",
        date: "2025-08-27",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e💬%3c/text%3e%3c/svg%3e"
    },
    {
        question: "What percentage of the Earth's land surface is covered by forest?",
        answer: 31,
        category: "",
        explanation: "",
        hint: "Around 76% of the Earth's land surface is habitable.",
        date: "2025-08-28",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e🌲%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many visitors did Disneyland Paris have in 2023?",
        answer: 16100000,
        category: "",
        explanation: "",
        hint: "The Louvre Museum had 8.9 million visitors in 2023.",
        date: "2025-08-29",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e🎢%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many people worldwide were 80 years or older in 2021?",
        answer: 155000000,
        category: "",
        explanation: "",
        hint: "The UN estimates that 459 million people will be aged 80 or older by 2050.",
        date: "2025-08-30",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e👵%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many pharmacies are there in the United Kingdom?",
        answer: 13822,
        category: "",
        explanation: "",
        hint: "There are around 1300 pharmacies in Scotland alone.",
        date: "2025-08-31",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e💊%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many electricians are there in the United States?",
        answer: 818700,
        category: "",
        explanation: "",
        hint: "In 2024, roughly 1.02 million single-family homes finished construction in the US.",
        date: "2025-09-01",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e🔌%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How much revenue in US dollars did Reddit make in the first half of 2025?",
        answer: 892000000,
        category: "",
        explanation: "",
        hint: "Reddit's revenue per daily active user was $4.53 in the second quarter of 2025.",
        date: "2025-09-02",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e💰%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many native Spanish speakers are there worldwide?",
        answer: 498500000,
        category: "",
        explanation: "",
        hint: "Mexico, Colombia, and Argentina all have more native Spanish speakers than Spain.",
        date: "2025-09-03",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e🇪🇸%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many elevators are there in Germany, excluding stair lifts?",
        answer: 815000,
        category: "",
        explanation: "",
        hint: "In 2021, 56% of Germany's 83 million residents lived in apartment buildings.",
        date: "2025-09-04",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e🛗%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many undergraduate students are there in the United Kingdom?",
        answer: 2050000,
        category: "",
        explanation: "",
        hint: "Around 749,000 babies were born in the United Kingdom in 2006.",
        date: "2025-09-05",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e🏛️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many cars were produced in China in 2024?",
        answer: 27480000,
        category: "",
        explanation: "",
        hint: "China exported 4.96 million cars in 2024.",
        date: "2025-09-06",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e🚗%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many Catholic priests are there worldwide?",
        answer: 407000,
        category: "",
        explanation: "",
        hint: "The number of baptized Catholics was around 1.4 billion in 2022.",
        date: "2025-09-07",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e⛪️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many US dollars are spent on gasoline per day in the United States?",
        answer: 1130000000,
        category: "",
        explanation: "",
        hint: "In August 2025, the average US price for gasoline was $3.13 per gallon/$0.83 per liter.",
        date: "2025-09-08",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e⛽️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many people were alive worldwide in 1925?",
        answer: 1980000000,
        category: "",
        explanation: "",
        hint: "The US population in 1925 was 111.7 million.",
        date: "2025-09-09",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e🌍%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many assistant, associate, and full professors are there in the US?",
        answer: 518300,
        category: "",
        explanation: "",
        hint: "Stanford University has a total of 1,595 professors.",
        date: "2025-09-10",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e🎓%3c/text%3e%3c/svg%3e"
    },
    {
        question: "What percentage of the Earth's land area is covered by South America?",
        answer: 12,
        category: "",
        explanation: "",
        hint: "The US alone covers around 6.6% of Earth's land area.",
        date: "2025-09-11",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e🌎%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many oil tankers with a capacity of at least 55,000 metric tons are there?",
        answer: 3219,
        category: "",
        explanation: "",
        hint: "OPEC produced 28 million barrels (4.4 billion liters) of crude oil per day in August 2025.",
        date: "2025-09-12",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e⛴️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many professional judges work in Germany's court system?",
        answer: 20793,
        category: "",
        explanation: "",
        hint: "In 2021, German courts convicted around 662,100 defendants by final judgment.",
        date: "2025-09-13",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e👨‍⚖️️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many popes have there been in the Catholic Church?",
        answer: 267,
        category: "",
        explanation: "",
        hint: "St. Peter is recognized as the first pope and died around AD 64.",
        date: "2025-09-14",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️⛪️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many visitors does the London Eye observation wheel receive each year?",
        answer: 3500000,
        category: "",
        explanation: "",
        hint: "The London Eye has 32 capsules, each of which holds up to 25 passengers.",
        date: "2025-09-15",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🎡%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How much revenue in US dollars did the Harry Potter film series make at the box office?",
        answer: 7700000000,
        category: "",
        explanation: "",
        hint: "The eight Harry Potter films earned $2.39 billion at the US box office.",
        date: "2025-09-16",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🍿%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many MacBooks were sold worldwide in 2024?",
        answer: 19700000,
        category: "",
        explanation: "",
        hint: "25.9% of Apple's total revenue in 2024 came from Europe.",
        date: "2025-09-17",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️💻%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many households in the US had an income exceeding $500,000 in 2022?",
        answer: 2478530,
        category: "",
        explanation: "",
        hint: "25.9M US households reported an income between $100,000 and $200,000 in 2022.",
        date: "2025-09-18",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🇺🇸%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many people work in McDonald's restaurants across the United States?",
        answer: 800000,
        category: "",
        explanation: "",
        hint: "There are 1,225 McDonald's restaurants in California.",
        date: "2025-09-19",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🍔%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many daily active users did Duolingo have as of March 2025?",
        answer: 46600000,
        category: "",
        explanation: "",
        hint: "Duolingo's revenue in the first three months of 2025 was $230.7 million.",
        date: "2025-09-20",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️📱%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many commercial airline pilots are employed worldwide?",
        answer: 382000,
        category: "",
        explanation: "",
        hint: "There were around 36.4 million scheduled commercial airline flights in 2024.",
        date: "2025-09-21",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️🧑‍✈️%3c/text%3e%3c/svg%3e"
    },
    {
        question: "How many divorces took place in Germany in 2024?",
        answer: 129337,
        category: "",
        explanation: "",
        hint: "Roughly 81% of the marriages formed in 2005 were still intact in 2015.",
        date: "2025-09-22",
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='62' font-size='40' text-anchor='middle' fill='%23374151'%3e️💔%3c/text%3e%3c/svg%3e"
    }
];

