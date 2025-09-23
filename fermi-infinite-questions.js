// Infinite challenge question bank without dates. Each question has a difficulty level.
const fermiInfiniteQuestions = [
    {
        id: 'population-urban-trees',
        level: 1,
        question: 'How many trees are planted in urban areas around the world each year?',
        answer: 120000000,
        category: 'Environment',
        hint: 'Think tens of millions rather than billions.',
        explanation: 'The UN estimates that roughly one hundred million trees are planted in urban areas annually as cities pursue canopy goals.',
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23e6ffed'/%3e%3ctext x='50' y='60' font-size='42' text-anchor='middle'%3e%F0%9F%8C%B3%3c/text%3e%3c/svg%3e"
    },
    {
        id: 'coffees-daily-us',
        level: 1,
        question: 'How many cups of coffee are consumed in the United States each day?',
        answer: 400000000,
        category: 'Lifestyle',
        hint: 'Roughly two cups per coffee drinker.',
        explanation: 'Survey data suggests that about 150 million Americans drink coffee daily and average more than two cups.',
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23fff7ed'/%3e%3ctext x='50' y='60' font-size='42' text-anchor='middle'%3e%F0%9F%8D%B5%3c/text%3e%3c/svg%3e"
    },
    {
        id: 'library-books-nypl',
        level: 1,
        question: 'How many items does the New York Public Library circulate in a year?',
        answer: 22000000,
        category: 'Culture',
        hint: 'A bit over twenty million.',
        explanation: 'The NYPL system circulates a little over twenty million items in a typical year across its branches.',
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f3f4ff'/%3e%3ctext x='50' y='60' font-size='42' text-anchor='middle'%3e%F0%9F%93%96%3c/text%3e%3c/svg%3e"
    },
    {
        id: 'bicycle-production',
        level: 2,
        question: 'How many bicycles are produced worldwide each year?',
        answer: 100000000,
        category: 'Transport',
        hint: 'It is just over one hundred million annually.',
        explanation: 'Industry statistics place annual bicycle production at roughly one hundred million units.',
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23eff6ff'/%3e%3ctext x='50' y='60' font-size='42' text-anchor='middle'%3e%F0%9F%9A%B2%3c/text%3e%3c/svg%3e"
    },
    {
        id: 'podcasts-count',
        level: 2,
        question: 'How many active podcasts exist globally?',
        answer: 3500000,
        category: 'Media',
        hint: 'A few million series are active.',
        explanation: 'Podcast directories list between 3–4 million active shows, including limited series and corporate podcasts.',
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23fdf2f8'/%3e%3ctext x='50' y='60' font-size='42' text-anchor='middle'%3e%F0%9F%8E%A7%3c/text%3e%3c/svg%3e"
    },
    {
        id: 'daily-airline-flights',
        level: 2,
        question: 'How many commercial airline flights take off worldwide on an average day?',
        answer: 90000,
        category: 'Transport',
        hint: 'Tens of thousands, not hundreds of thousands.',
        explanation: 'Flight tracking services report around ninety thousand commercial departures per day worldwide.',
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23ecfeff'/%3e%3ctext x='50' y='60' font-size='42' text-anchor='middle'%3e%F0%9F%9A%80%3c/text%3e%3c/svg%3e"
    },
    {
        id: 'solar-capacity-added',
        level: 3,
        question: 'How much solar generation capacity was added worldwide in 2023 (in megawatts)?',
        answer: 440000,
        category: 'Energy',
        hint: 'Hundreds of gigawatts were added.',
        explanation: 'International energy agencies estimate that around 440 GW of solar capacity was added in 2023, equal to 440,000 megawatts.',
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23fefce8'/%3e%3ctext x='50' y='60' font-size='42' text-anchor='middle'%3e%F0%9F%8C%9E%3c/text%3e%3c/svg%3e"
    },
    {
        id: 'freshwater-withdrawal',
        level: 3,
        question: 'What is the total annual global freshwater withdrawal in cubic kilometers?',
        answer: 4000,
        category: 'Environment',
        hint: 'A few thousand cubic kilometers per year.',
        explanation: 'Global freshwater withdrawal is roughly 4,000 km³ annually across agriculture, industry, and households.',
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23e0f2fe'/%3e%3ctext x='50' y='60' font-size='42' text-anchor='middle'%3e%F0%9F%8C%82%3c/text%3e%3c/svg%3e"
    },
    {
        id: 'github-repositories',
        level: 3,
        question: 'How many public repositories are hosted on GitHub?',
        answer: 400000000,
        category: 'Technology',
        hint: 'Hundreds of millions of repositories.',
        explanation: 'GitHub surpassed 400 million public repositories, counting forks and archived projects.',
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23eef2ff'/%3e%3ctext x='50' y='60' font-size='42' text-anchor='middle'%3e%F0%9F%96%A5%EF%B8%8F%3c/text%3e%3c/svg%3e"
    },
    {
        id: 'protein-consumption-global',
        level: 4,
        question: 'How many tonnes of animal protein are consumed globally each year?',
        answer: 130000000,
        category: 'Food',
        hint: 'Think a bit over one hundred million tonnes.',
        explanation: 'FAO data suggests about 130 million tonnes of animal protein consumption annually worldwide.',
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23fef2f2'/%3e%3ctext x='50' y='60' font-size='42' text-anchor='middle'%3e%F0%9F%A5%9C%3c/text%3e%3c/svg%3e"
    },
    {
        id: 'data-centre-energy',
        level: 4,
        question: 'How much electricity do data centres worldwide consume annually (in terawatt-hours)?',
        answer: 400,
        category: 'Technology',
        hint: 'A few hundred TWh—roughly the usage of a medium-sized country.',
        explanation: 'Recent estimates put global data centre consumption near 400 TWh per year.',
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f8fafc'/%3e%3ctext x='50' y='60' font-size='42' text-anchor='middle'%3e%F0%9F%94%8C%3c/text%3e%3c/svg%3e"
    },
    {
        id: 'worldwide-book-sales',
        level: 4,
        question: 'How many printed books are sold worldwide in a year?',
        answer: 2500000000,
        category: 'Culture',
        hint: 'Low single-digit billions annually.',
        explanation: 'Publishing industry reports put annual global printed book sales near 2.5 billion copies.',
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f1f5f9'/%3e%3ctext x='50' y='60' font-size='42' text-anchor='middle'%3e%F0%9F%93%9A%3c/text%3e%3c/svg%3e"
    },
    {
        id: 'worldwide-sea-cargo',
        level: 5,
        question: 'What is the annual global seaborne trade volume in metric tonnes?',
        answer: 12000000000,
        category: 'Trade',
        hint: 'Twelve billion tonnes travel by ship each year.',
        explanation: 'UNCTAD estimates seaborne trade at roughly twelve billion tonnes annually.',
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23e0f2f1'/%3e%3ctext x='50' y='60' font-size='42' text-anchor='middle'%3e%F0%9F%9A%A2%3c/text%3e%3c/svg%3e"
    },
    {
        id: 'supercomputer-flops',
        level: 5,
        question: 'How many floating point operations per second can the fastest supercomputer achieve?',
        answer: 120000000000000000,
        category: 'Technology',
        hint: 'On the order of one hundred quintillion FLOPS.',
        explanation: 'Frontier, the top-ranked supercomputer, delivers roughly 1.2×10^17 floating point operations per second.',
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f5f3ff'/%3e%3ctext x='50' y='60' font-size='42' text-anchor='middle'%3e%F0%9F%A6%84%3c/text%3e%3c/svg%3e"
    },
    {
        id: 'space-debris',
        level: 5,
        question: 'Roughly how many tracked pieces of space debris larger than 1 cm orbit Earth?',
        answer: 900000,
        category: 'Space',
        hint: 'Close to a million objects.',
        explanation: 'Space agencies track close to nine hundred thousand pieces of debris larger than one centimetre.',
        image: "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23ede9fe'/%3e%3ctext x='50' y='60' font-size='42' text-anchor='middle'%3e%F0%9F%8C%8C%3c/text%3e%3c/svg%3e"
    }
];

if (typeof window !== 'undefined') {
    window.fermiInfiniteQuestions = fermiInfiniteQuestions;
}
