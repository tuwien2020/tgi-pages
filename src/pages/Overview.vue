<template>
  <h1>Overview Page</h1>

  <pre></pre>

  <h3>Important cat pages</h3>
  <ul>
    <li><a href="https://cataas.com/" target="_blank">Cat as a service</a></li>
    <li>
      <a href="https://stefnotch.github.io/shakespeares-cats/" target="_blank"
        >Shakespeare's Cats
      </a>
    </li>
    <li>
      <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" target="_blank"
        >Nyehehe</a
      >
    </li>
  </ul>

  <h3>Bin&auml;r Rechner</h3>
  <ul>
    <li>
      <router-link to="/binary-calculator">Bin&auml;r Rechner</router-link>
    </li>
    <li>
      <a
        href="https://www.arndt-bruenner.de/mathe/scripts/Zahlensysteme.htm"
        target="_blank"
        >Bin&auml;r umrechnen (Bei direkten Umrechnungen kann es Rundungsfehler
        geben, da der Rechner immer über das 10er-System geht.)</a
      >
    </li>
    <li>
      <a
        href="https://miniwebtool.com/de/binary-calculator/?number1=-110101&operate=1&number2=1001"
        target="_blank"
        >Binär Operationen (+, -, *, /) (Komma Zahlen funktionieren nicht)</a
      >
    </li>
    <li>
      <a href="http://weitz.de/ieee/">IEEE Rechner</a>
    </li>
    <li>
      <a
        href="https://trustconverter.com/en/data-storage-conversion/zettabits/zettabits-to-bits.html"
        target="_blank"
        >SI Bits Conversion (Kilobits, Gibibytes etc.)</a
      >
    </li>
  </ul>

  <h3>EAN 13</h3>
  <ul>
    <li>
      <a
        href="https://www.arndt-bruenner.de/mathe/scripts/pruefziffern.htm"
        target="_blank"
        >EAN 13 Decoder</a
      >
    </li>
  </ul>

  <h3>Morse Code</h3>
  <ul>
    <li>
      <a href="https://morsedecoder.com/de/" target="_blank"
        >Morse Code Decoder</a
      >
    </li>
  </ul>

  <h3>Hamming Code</h3>
  <ul>
    <li><router-link to="/hamming-code">Hamming Code</router-link></li>
    <li><router-link to="/hamming-distance">Hamming Distance</router-link></li>
  </ul>

  <!-- <h3>Polynom Code</h3>
  <ul>
    <li><router-link to="/polynom-code">Polynom Code</router-link></li>
  </ul>-->

  <h3>Wahrscheinlichkeitsrechner</h3>
  <ul>
    <li>
      <a
        href="https://www.rechner.club/wahrscheinlichkeit/wuerfelsumme-berechnen"
        target="_blank"
        >W&uuml;rfel-Wahrscheinlichkeitsrechner</a
      >
    </li>
  </ul>

  <h3>Huffman Code</h3>
  <ul>
    <li>
      <a href="https://planetcalc.com/2481/" target="_blank"
        >Huffman-Code (Durchschnittliche Wortlänge, welche ausgerechnet wird von
        der Site, nicht verwenden!): Info: Kleinere Zahlen: 0, Größere Zahlen: 1
        (Man kann links unten invertieren)</a
      >
    </li>
    <li>
      <a href="https://www.wolframalpha.com/" target="_blank"
        >Wolfram Alpha (log2 berechnen)</a
      >
    </li>
    <li>
      <a href="https://rechneronline.de/logarithmus/" target="_blank"
        >Logarithmus dualis</a
      >
    </li>
  </ul>

  <h3>Boolesche Algebra</h3>
  <ul>
    <li><router-link to="/truth-table">Wahrheitstabelle</router-link></li>
  </ul>

  <!-- Stuff and thingies -->
  <h3>GitHub</h3>
  <ul>
    <li>
      <a href="https://github.com/tuwien2020/tgi-pages" target="_blank"
        >TGI Pages</a
      >
    </li>
  </ul>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, watchEffect } from "vue";

export default defineComponent({
  components: {},
  setup() {
    const count = ref(0);

    return {
      count,
    };
  },
});
</script>
