import { DefineComponent } from "vue";
import { groupBy } from "../assets/utilities";
import HammingCode from "./../pages/HammingCode.vue";
import TruthTable from "./../pages/TruthTable.vue";
import HammingDistance from "./../pages/HammingDistance.vue";
import BinaryCalculator from "./../pages/BinaryCalculator.vue";
import BinaryCoding from "./../pages/BinaryCoding.vue";
import Pipeline from "./../pages/Pipeline.vue";
import InterleavingGraph from "./../pages/InterleavingGraph.vue";
import CacheCalc from "./../pages/CacheCalc.vue";
import Stack from "./../pages/Stack.vue";
import Micro16Decompiler from "./../pages/Micro16Decompiler.vue";
import HuffmanCode from "./../pages/HuffmanCode.vue";

type PageEntry =
  | {
      name: string;
      link: string;
      category: Chapter;
      internal: true;
      page: DefineComponent;
    }
  | {
      name: string;
      link: string;
      category: Chapter;
      internal: false;
    };

interface PageSearchResult {
  name: string;
  link: string;
  internal: boolean;
}

interface Chapter {
  number: number;
  name: string;
}

const chapters: Chapter[] = [
  {
    number: 2,
    name: "Numerik",
  },
  {
    number: 3,
    name: "Codierung",
  },
  {
    number: 4,
    name: "Informationstheorie",
  },
  {
    number: 5,
    name: "Boole'sche Algebra",
  },
  {
    number: 6,
    name: "KV & BDD",
  },
  {
    number: 7,
    name: "Digitalschaltungen",
  },
  {
    number: 8,
    name: "Automaten",
  },
  {
    number: 9,
    name: "Sequenzielle Logik",
  },
  {
    number: 10,
    name: "Speicher",
  },
  {
    number: 11,
    name: "Schaltwerke",
  },
  {
    number: 12,
    name: "Schaltwerke Realisierung",
  },
  {
    number: 13,
    name: "Schaltwerke: Moore vs Mealy",
  },
  {
    number: 14,
    name: "Micro16",
  },
  {
    number: 15,
    name: "Befehlssatz",
  },
  {
    number: 16,
    name: "Pipelining",
  },
  {
    number: 17,
    name: "Speichermanagement",
  },
  {
    number: 18,
    name: "Multicore",
  },
  {
    number: 19,
    name: "Speichermodelle",
  },
];

export const getCategory = (id: number): Chapter => chapters.filter((val) => val.number == id)[0];

const tools: PageEntry[] = [
  {
    name: "Binär Codierung",
    link: "binary-coding",
    category: getCategory(2),
    internal: true,
    page: BinaryCoding,
  },
  {
    name: "Binär Rechner",
    link: "binary-calculator",
    category: getCategory(2),
    internal: true,
    page: BinaryCalculator,
  },
  {
    name: "Binär umrechnen (Bei direkten Umrechnungen kann es Rundungsfehler geben)",
    link: "https://www.arndt-bruenner.de/mathe/scripts/Zahlensysteme.htm",
    category: getCategory(2),
    internal: false,
  },
  {
    name: "IEEE Rechner",
    link: "http://weitz.de/ieee/",
    category: getCategory(2),
    internal: false,
  },
  {
    name: "Wahrheitstabelle",
    link: "truth-table",
    category: getCategory(5),
    internal: true,
    page: TruthTable,
  },
  {
    name: "Boole'sche Ausdrücke",
    link: "https://www.dcode.fr/boolean-expressions-calculator",
    category: getCategory(5),
    internal: false,
  },
  {
    name: "KV Diagramm",
    link: "https://www.mathematik.uni-marburg.de/~thormae/lectures/ti1/code/karnaughmap/",
    category: getCategory(6),
    internal: false,
  },
  {
    name: "KV Diagramm & BDD",
    link: "https://kmio.de/logikrechner.html",
    category: getCategory(6),
    internal: false,
  },
  {
    name: "Mikro 16 Decompiler",
    link: "micro16-decompiler",
    category: getCategory(14),
    internal: true,
    page: Micro16Decompiler,
  },
  {
    name: "Mikro 16 extended instruction set compiler",
    link: "https://tgi.rwutscher.com/",
    category: getCategory(14),
    internal: false,
  },
  {
    name: "EAN 13 Barcode",
    link: "https://online-barcode-reader.inliteresearch.com/",
    category: getCategory(3),
    internal: false,
  },
  {
    name: "EAN 13 Decoder",
    link: "https://www.arndt-bruenner.de/mathe/scripts/pruefziffern.htm",
    category: getCategory(3),
    internal: false,
  },
  {
    name: "Hamming Code",
    link: "hamming-code",
    category: getCategory(3),
    internal: true,
    page: HammingCode,
  },
  {
    name: "Hamming Distanz",
    link: "hamming-distance",
    category: getCategory(3),
    internal: true,
    page: HammingDistance,
  },
  {
    name: "NRZ und co",
    link: "http://www.ece.unb.ca/cgi-bin/tervo/encoding.pl",
    category: getCategory(3),
    internal: false,
  },
  {
    name: "Polynomcode",
    link: "http://public.hochschule-trier.de/~knorr/crc.php",
    category: getCategory(3),
    internal: false,
  },
  {
    name: "Morse Code",
    link: "https://morsedecoder.com/de/",
    category: getCategory(3),
    internal: false,
  },
  {
    name: "Huffman-Code, Durchschnittliche Wortlänge nicht verwenden",
    link: "https://planetcalc.com/2481/",
    category: getCategory(4),
    internal: false,
  },
  {
    name: "Huffman-Code WIP",
    link: "huffman-code",
    category: getCategory(4),
    internal: true,
    page: HuffmanCode,
  },
  {
    name: "log2 - Wolfram Alpha",
    link: "https://www.wolframalpha.com/",
    category: getCategory(4),
    internal: false,
  },
  {
    name: "Würfel - Wahrscheinlichkeitsrechner",
    link: "https://www.rechner.club/wahrscheinlichkeit/wuerfelsumme-berechnen",
    category: getCategory(4),
    internal: false,
  },
  {
    name: "log2 - rechneronline.de",
    link: "https://rechneronline.de/logarithmus/",
    category: getCategory(4),
    internal: false,
  },
  {
    name: "Digitalschaltungen Simulator",
    link: "https://simulator.io/board",
    category: getCategory(11),
    internal: false,
  },
  {
    name: "Digitalschaltungen Simulator (alternativ)",
    link: "https://logigator.com/editor/",
    category: getCategory(11),
    internal: false,
  },
  {
    name: "Schaltkreise",
    link: "http://falstad.com/circuit/circuitjs.html",
    category: getCategory(7),
    internal: false,
  },
  {
    name: "SI Bits Umrechnung",
    link: "https://trustconverter.com/en/data-storage-conversion/zettabits/zettabits-to-bits.html",
    category: getCategory(17),
    internal: false,
  },
  {
    name: "MHz zu Nanosekunden umrechnen",
    link: "https://www.unitjuggler.com/frequency-umwandeln-von-MHz-nach-ns(p).html",
    category: getCategory(17),
    internal: false,
  },
  {
    name: "Stack Simulator",
    link: "stack",
    category: getCategory(15),
    internal: true,
    page: Stack,
  },
  {
    name: "Pipeline Simulator (not recommended)",
    link: "pipeline",
    category: getCategory(16),
    internal: true,
    page: Pipeline,
  },
  {
    name: "Interleaving Graph",
    link: "pipeline",
    category: getCategory(19),
    internal: true,
    page: InterleavingGraph,
  },
];

export const indexedPages = tools.filter((t) => t.category != null);
export const pages = tools.filter((entry) => entry.internal) as (PageEntry & { internal: true })[];
export const pagesByCategory = groupBy<Chapter, PageEntry>(
  indexedPages,
  (p) => p.category,
  (a, b) => a.number - b.number
);
export const searchablePages: PageSearchResult[] = indexedPages.map((p) => {
  return { name: p.name, link: p.link, internal: p.internal };
});

export const searchTools = (searchText: string): PageSearchResult[] => {
  return searchablePages.filter((t) => t.name.match(searchText));
};

export default tools;
