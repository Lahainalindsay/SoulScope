type ChakraEnergy = {
  root: number;
  sacral: number;
  solar: number;
  heart: number;
  throat: number;
  thirdEye: number;
  crown: number;
};

export function mapFrequenciesToChakras(
  frequencies: number[],
  sampleRate: number
): ChakraEnergy {
  const bandEnergy: ChakraEnergy = {
    root: 0,
    sacral: 0,
    solar: 0,
    heart: 0,
    throat: 0,
    thirdEye: 0,
    crown: 0,
  };

  // Chakra frequency ranges (Hz), roughly mapped to FFT bins.
  const ranges: Record<keyof ChakraEnergy, [number, number]> = {
    root: [20, 150],
    sacral: [151, 275],
    solar: [276, 400],
    heart: [401, 600],
    throat: [601, 850],
    thirdEye: [851, 1100],
    crown: [1101, 1400],
  };

  const binSize = sampleRate / frequencies.length;

  frequencies.forEach((mag, i) => {
    const freq = i * binSize;
    (Object.keys(ranges) as (keyof ChakraEnergy)[]).forEach((chakra) => {
      const [min, max] = ranges[chakra];
      if (freq >= min && freq <= max) {
        bandEnergy[chakra] += mag;
      }
    });
  });

  const maxEnergy = Math.max(...Object.values(bandEnergy)) || 1;
  (Object.keys(bandEnergy) as (keyof ChakraEnergy)[]).forEach((chakra) => {
    bandEnergy[chakra] = Math.round((bandEnergy[chakra] / maxEnergy) * 100);
  });

  return bandEnergy;
}
