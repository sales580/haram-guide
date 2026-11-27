/* Haramain Path: the inside of Masjid an-Nabawi, section by section.
   Where each section, court and facility sits follows the General Authority's own visitor map of the Prophet's Mosque
   (third edition, May 2025; a copy is kept in source/official for reference). That map is a diagram, not a survey,
   so everything here was re-placed by hand onto the real outline of the building, using the gate numbers as anchors.
   Treat positions as good to about 20 metres. Units are metres in the same grid as maps.js (x east, y south).
   zones: [kind, name, x0, y0, x1, y1]   kinds: old, first, men, women, court
   labels: [text, x, y, zoom]            marks: extra places shown as dots with a name */
window.UMRAH_INSIDE = {
  /* Masjid al-Haram. No official floor plan is published, so the parts of the building are the shapes volunteers
     have mapped on OpenStreetMap, each given its own colour and name. Gate numbers, the five main gates and where the
     services are come from the Ministry of Hajj and Umrah's "Grand Mosque Awareness Guide" (a copy is in source/official).
     Each mark sits at the gate the guide names for it, so treat it as "near this gate", not an exact spot. */
  makkah: {
    zones: [],
    fills: { bld: 'zFirst', ext: ['zNorth', 'zOld'], masaa: 'zCourt' },
    key: [['zFirst', 'Old mosque and first Saudi expansion'], ['zOld', 'King Fahd expansion'], ['zNorth', 'King Abdullah expansion'], ['zCourt', 'Mas‘a (Safa to Marwah)'], ['mOpen', 'Mataf']],
    note: 'The five main gates each have two minarets: 1 King Abdulaziz, 45 Al-Fath, 62 Umrah, 79 King Fahd and 100 King Abdullah. Gates with ramps: 68, 74, 79, 84, 89, 90, 93 and 94. Gate numbers and services follow the Ministry of Hajj’s Grand Mosque guide; the shapes come from OpenStreetMap. The Masjid has several floors and this map shows the ground level. Some smaller gate numbers may be older ones.',
    labels: [['Old mosque', 628, 612, 2.6]],
    gates: [{ n: 'Umrah Gate', r: '62' }, { n: 'Al-Fath Gate', r: '45' }],
    addGates: [{ n: 'King Abdullah Gate', r: '100', x: 432, y: 439 }],
    marks: [
      { n: 'Ajyad Bridge, by Gate 4', s: 'Ajyad Bridge', x: 714, y: 886, z: 2, note: 'A bridge up to the first floor of the tawaf area. Free wheelchairs and golf carts are offered here.' },
      { n: 'Al-Shubaika Bridge, by Gate 64', s: 'Shubaika Bridge', x: 478, y: 714, z: 2, note: 'A bridge into the King Fahd expansion from the western courtyard. Wheelchairs are offered here, and a luggage storage centre stands opposite Gate 64.' },
      { n: 'Al-Arqam stairs, by Gate 16', s: 'Arqam stairs', x: 832, y: 730, z: 2.6, note: 'The way up to the first floor of the mas‘a.' },
      { n: 'Hair cutting for men, next to Marwah Gate', s: 'Hair cutting', x: 797, y: 408, z: 2.2, note: 'Where sa‘i ends. The official guide places the men’s hair-cutting service directly next to Marwah Gate. For women it is offered at several places in the eastern courtyard.' },
      { n: 'Prayer area for people with disabilities, Gate 68', s: 'Accessible prayer area', x: 452, y: 752, z: 3, note: 'King Fahd expansion, ground floor, next to the Al-Shubaika stairs. There is another on the first floor opposite Gate 91.' },
      { n: 'Children’s hospitality centre, opposite Gates 100 to 104', s: 'Children’s centre', x: 404, y: 446, z: 3, note: 'In the King Abdullah (third Saudi) expansion. It is seasonal, so check that it is open.' }
    ]
  },
  madinah: {
    key: [['zOld', 'Old mosque'], ['zFirst', 'First Saudi expansion'], ['zMen', 'Later expansions'], ['zWomen', 'Women’s sections'], ['zCourt', 'Open courts']],
    note: 'Sections follow the official visitor map of the Prophet’s Mosque (May 2025), placed here to within about 20 m. The dashed line in the south courtyard is level with the imam.',
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
