interface PageEntry {
    name: string;
    link: string;
    category: string;
    tags: string[];
    internal: Boolean;
}

const pages: PageEntry[] = [
    {
        name: "Truth Table", 
        link: "truth-table", 
        category: "aussagenlogik",
        tags: [
                "boolsche", 
                "logik", 
        ],
        internal: true
    },
    {
        name: "Mikro 16 Decompiler", 
        link: "micro16-decompiler", 
        category: "Mikro 16",
        tags: [
                "mikro 16", 
                "bytecode", 
                "dekompilieren" 
        ],
        internal: true
     },
     {
        name: "Mikro 16 extended instruction set compiler", 
        link: "https://tgi.rwutscher.com/", 
        category: "Mikro 16",
        tags: [
                "mikro 16", 
                "bytecode", 
                "compile" 
        ],
        internal: false
     }
];

export default pages;