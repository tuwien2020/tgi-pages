import { DefineComponent } from "vue";
import { groupBy } from "../assets/utilities";
import HammingCode from "./../pages/HammingCode.vue";
import TruthTable from "./../pages/TruthTable.vue";
import HammingDistance from "./../pages/HammingDistance.vue";
import BinaryCalculator from "./../pages/BinaryCalculator.vue";
import BinaryCoding from "./../pages/BinaryCoding.vue";
import Pipeline from "./../pages/Pipeline.vue";
import InterleavingGraph from "./../pages/InterleavingGraph.vue";
import BaseConverter from "./../pages/BaseConverter.vue";
import CacheCalc from "./../pages/CacheCalc.vue";
import Stack from "./../pages/Stack.vue";
import Micro16Decompiler from "./../pages/Micro16Decompiler.vue";
import IntervalScheduling from "./../pages/algodat/IntervalScheduling.vue";

type PageEntry =
  | {
      name: string;
      link: string;
      category: ChapterEntry;
      internal: true;
      page: any;
    }
  | {
      name: string;
      link: string;
      category: ChapterEntry;
      internal: false;
    };

interface PageSearchResult {
  name: string;
  link: string;
  internal: boolean;
}

interface ChapterEntry {
  number: number;
  name: string;
}

export enum Chapter {
  Zahlendarstellung = 1,
  Numerik = 2,
  Codierung = 3,
  Informationstheorie = 4,
  BoolescheAlgebra = 5,
  BDD = 6,
  Automaten = 8,
  SequenzielleLogik = 9,
  Speicher = 10,
  Schaltwerke = 11,
  SchaltwerkeRealisierung = 12,
  SchaltwerkeMooreMealy = 13,
  Micro16 = 14,
  Befehlssatz = 15,
  Pipelining = 16,
  Speichermanagement = 17,
  Multicore = 18,
  Speichermodelle = 19,
  Algodat = 20,
}

export const chapters: { [c in Chapter]: ChapterEntry } = {
  [Chapter.Zahlendarstellung]: {
    number: 1,
    name: "category.numberFormats",
  },
  [Chapter.Numerik]: {
    number: 2,
    name: "category.numerical",
  },
  [Chapter.Codierung]: {
    number: 3,
    name: "category.encodingDecoding",
  },
  [Chapter.Informationstheorie]: {
    number: 4,
    name: "category.informationTheory",
  },
  [Chapter.BoolescheAlgebra]: {
    number: 5,
    name: "category.booleanAlgebra",
  },
  [Chapter.BDD]: {
    number: 6,
    name: "category.Bdd",
  },
  [Chapter.Automaten]: {
    number: 8,
    name: "category.finiteStateMachines",
  },
  [Chapter.SequenzielleLogik]: {
    number: 9,
    name: "category.sequentialLogic",
  },
  [Chapter.Speicher]: {
    number: 10,
    name: "category.memory",
  },
  [Chapter.Schaltwerke]: {
    number: 11,
    name: "category.sequentialCircuitIntro",
  },
  [Chapter.SchaltwerkeRealisierung]: {
    number: 12,
    name: "category.sequentialCircuitImplementation",
  },
  [Chapter.SchaltwerkeMooreMealy]: {
    number: 13,
    name: "category.sequentialCircuitMachines",
  },
  [Chapter.Micro16]: {
    number: 14,
    name: "category.micro16",
  },
  [Chapter.Befehlssatz]: {
    number: 15,
    name: "category.instructionSet",
  },
  [Chapter.Pipelining]: {
    number: 16,
    name: "category.pipelining",
  },
  [Chapter.Speichermanagement]: {
    number: 17,
    name: "category.memoryManagement",
  },
  [Chapter.Multicore]: {
    number: 18,
    name: "category.multicore",
  },
  [Chapter.Speichermodelle]: {
    number: 19,
    name: "category.memoryModels",
  },
  [Chapter.Algodat]: {
    number: 20,
    name: "category.algodat",
  },
};

const tools: PageEntry[] = [
  {
    name: "page.binaryCoding.title",
    link: "binary-coding",
    category: chapters[Chapter.Codierung],
    internal: true,
    page: BinaryCoding,
  },
  {
    name: "page.binaryCalculator.title",
    link: "binary-calculator",
    category: chapters[Chapter.Zahlendarstellung],
    internal: true,
    page: BinaryCalculator,
  },
  {
    name: "page.baseConverter.title",
    link: "base-converter",
    internal: true,
    category: chapters[Chapter.Zahlendarstellung],
    page: BaseConverter,
  },
  {
    name: "Binär umrechnen (Bei direkten Umrechnungen kann es Rundungsfehler geben)",
    link: "https://www.arndt-bruenner.de/mathe/scripts/Zahlensysteme.htm",
    category: chapters[Chapter.Zahlendarstellung],
    internal: false,
  },
  {
    name: "page.ieeeFloatCalculator.title",
    link: "http://weitz.de/ieee/",
    category: chapters[Chapter.Numerik],
    internal: false,
  },
  {
    name: "page.truthTable.title",
    link: "truth-table",
    category: chapters[Chapter.BoolescheAlgebra],
    internal: true,
    page: TruthTable,
  },
  {
    name: "Boole'sche Ausdrücke",
    link: "https://www.dcode.fr/boolean-expressions-calculator",
    category: chapters[Chapter.BoolescheAlgebra],
    internal: false,
  },
  {
    name: "KV Diagramm",
    link: "https://www.mathematik.uni-marburg.de/~thormae/lectures/ti1/code/karnaughmap/",
    category: chapters[Chapter.BDD],
    internal: false,
  },
  {
    name: "KV Diagramm & BDD",
    link: "https://kmio.de/logikrechner.html",
    category: chapters[Chapter.BDD],
    internal: false,
  },
  {
    name: "page.micro16Decompiler.title",
    link: "micro16-decompiler",
    category: chapters[Chapter.Micro16],
    internal: true,
    page: Micro16Decompiler,
  },
  {
    name: "Mikro 16 extended instruction set compiler",
    link: "https://tgi.rwutscher.com/",
    category: chapters[Chapter.Micro16],
    internal: false,
  },
  {
    name: "Mikro 16 VS Code Syntax Highlight Extension",
    link: "https://github.com/KMikeeU/micro16-vscode",
    category: chapters[Chapter.Micro16],
    internal: false,
  },
  {
    name: "EAN 13 Barcode",
    link: "https://online-barcode-reader.inliteresearch.com/",
    category: chapters[Chapter.Codierung],
    internal: false,
  },
  {
    name: "EAN 13 Decoder",
    link: "https://www.arndt-bruenner.de/mathe/scripts/pruefziffern.htm",
    category: chapters[Chapter.Codierung],
    internal: false,
  },
  {
    name: "page.hammingCode.title",
    link: "hamming-code",
    category: chapters[Chapter.Codierung],
    internal: true,
    page: HammingCode,
  },
  {
    name: "page.hammingDistance.title",
    link: "hamming-distance",
    category: chapters[Chapter.Codierung],
    internal: true,
    page: HammingDistance,
  },
  {
    name: "NRZ und co",
    link: "http://www.ece.unb.ca/cgi-bin/tervo/encoding.pl",
    category: chapters[Chapter.Codierung],
    internal: false,
  },
  {
    name: "Polynomcode",
    link: "http://public.hochschule-trier.de/~knorr/crc.php",
    category: chapters[Chapter.Codierung],
    internal: false,
  },
  {
    name: "page.morseCode.title",
    link: "https://morsedecoder.com/de/",
    category: chapters[Chapter.Codierung],
    internal: false,
  },
  {
    name: "Huffman-Code, Durchschnittliche Wortlänge nicht verwenden",
    link: "https://planetcalc.com/2481/",
    category: chapters[Chapter.Informationstheorie],
    internal: false,
  },
  {
    name: "log2 - Wolfram Alpha",
    link: "https://www.wolframalpha.com/input?i=log_2%2827%29",
    category: chapters[Chapter.Informationstheorie],
    internal: false,
  },
  {
    name: "Würfel - Wahrscheinlichkeitsrechner",
    link: "https://www.rechner.club/wahrscheinlichkeit/wuerfelsumme-berechnen",
    category: chapters[Chapter.Informationstheorie],
    internal: false,
  },
  {
    name: "log2 - rechneronline.de",
    link: "https://rechneronline.de/logarithmus/",
    category: chapters[Chapter.Informationstheorie],
    internal: false,
  },
  {
    name: "page.logicCircuitSimulator.title",
    link: "https://logigator.com/editor/",
    category: chapters[Chapter.Schaltwerke],
    internal: false,
  },
  {
    name: "SI Bits Umrechnung",
    link: "https://trustconverter.com/en/data-storage-conversion/zettabits/zettabits-to-bits.html",
    category: chapters[Chapter.Speichermanagement],
    internal: false,
  },
  {
    name: "MHz zu Nanosekunden umrechnen",
    link: "https://www.unitjuggler.com/frequency-umwandeln-von-MHz-nach-ns(p).html",
    category: chapters[Chapter.Speichermanagement],
    internal: false,
  },
  {
    name: "page.stackSimulator.title",
    link: "stack",
    category: chapters[Chapter.Befehlssatz],
    internal: true,
    page: Stack,
  },
  {
    name: "page.pipelineSimulator.title",
    link: "pipeline",
    category: chapters[Chapter.Pipelining],
    internal: true,
    page: Pipeline,
  },
  {
    name: "page.interleavingGraph.title",
    link: "interleaving-graph",
    category: chapters[Chapter.Speichermodelle],
    internal: true,
    page: InterleavingGraph,
  },
  {
    name: "page.intervalScheduling.title",
    link: "interval-scheduling",
    category: chapters[Chapter.Algodat],
    internal: true,
    page: IntervalScheduling,
  },
];

export const indexedPages = tools.filter((t) => t.category != null);
export const pages = tools.filter((entry) => entry.internal) as (PageEntry & { internal: true })[];
export const pagesByCategory = groupBy<ChapterEntry, PageEntry>(
  indexedPages,
  (p) => p.category,
  (a, b) => a.number - b.number
);
export const searchablePages: PageSearchResult[] = indexedPages.map((p) => {
  return { name: p.name, link: p.link, internal: p.internal };
});

export default tools;
