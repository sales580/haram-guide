/* Haram Guide: the inside of Masjid an-Nabawi, section by section.
   Where each section, court and facility sits follows the General Authority's own visitor map of the Prophet's Mosque
   (third edition, May 2025; a copy is kept in source/official for reference). That map is a diagram, not a survey,
   so everything here was re-placed by hand onto the real outline of the building, using the gate numbers as anchors.
   Treat positions as good to about 20 metres. Units are metres in the same grid as maps.js (x east, y south).
   zones: [kind, name, x0, y0, x1, y1]   kinds: old, first, men, women, court
   labels: [text, x, y, zoom]            marks: extra places shown as dots with a name */
window.UMRAH_INSIDE = {
  madinah: {
    zones: [
      ['men', 'Northern expansion', 325, 150, 492, 280],
      ['women', 'Women’s section (west)', 225, 150, 325, 280],
      ['women', 'Women’s section (east)', 492, 150, 660, 280],
      ['men', 'Western expansion', 225, 280, 391, 460],
      ['men', 'Eastern expansion', 487, 280, 660, 460],
      ['first', 'First Saudi expansion', 391, 260, 487, 400],
      ['old', 'The old mosque', 391, 400, 487, 460],
      ['court', 'Open court', 419, 351, 469, 390],
      ['court', 'Open court', 419, 292, 469, 334]
    ],
    labels: [
      ['Northern expansion', 408, 215, 1.6], ['Western expansion', 312, 338, 1.6], ['Eastern expansion', 570, 338, 1.6],
      ['First Saudi expansion', 439, 271, 2.4], ['Old mosque', 418, 412, 2.4], ['Open court', 444, 371, 3], ['Open court', 444, 313, 3]
    ],
    /* outside rows should not stand ahead of this line: it is level with the imam */
    imamLine: { y: 433, x0: 225, x1: 660, text: 'Level with the imam' },
    marks: [
      { n: 'Rawdah entrance (with a Nusuk permit)', s: 'Rawdah entrance', x: 536, y: 428, z: 2, note: 'Where the official map marks the way in to the Rawdah for people holding a permit. The entrance can be moved, so follow the signs and your permit.' },
      { n: 'As-Salam entrance for men', s: 'As-Salam entrance', x: 453, y: 520, z: 2, note: 'Where the official map marks the men’s way in to pass by and give salam to the Prophet ﷺ. You leave by Al-Baqi Gate (41).' },
      { n: 'Escalator to the roof, near Gate 6', s: 'To the roof', x: 268, y: 392, z: 3.2, note: 'Escalators here go up to the roof prayer area when it is open.' },
      { n: 'Escalator to the roof, near Gates 10 and 11', s: 'To the roof', x: 268, y: 282, z: 3.2, note: 'Escalators here go up to the roof prayer area when it is open.' },
      { n: 'Escalator to the roof, near Gate 15', s: 'To the roof', x: 282, y: 178, z: 3.2, note: 'Escalators here go up to the roof prayer area when it is open.' },
      { n: 'Escalator to the roof, near Gate 27', s: 'To the roof', x: 630, y: 178, z: 3.2, note: 'Escalators here go up to the roof prayer area when it is open.' },
      { n: 'Escalator to the roof, near Gates 31 and 32', s: 'To the roof', x: 636, y: 282, z: 3.2, note: 'Escalators here go up to the roof prayer area when it is open.' },
      { n: 'Escalator to the roof, near Gate 36', s: 'To the roof', x: 632, y: 392, z: 3.2, note: 'Escalators here go up to the roof prayer area when it is open.' }
    ]
  }
};
