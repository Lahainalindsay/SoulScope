type ChakraGlyphProps = {
  chakra: string;
};

export default function ChakraGlyph({ chakra }: ChakraGlyphProps) {
  const slug = chakra.toLowerCase().replace(/\s+/g, "-");
  const src = `/chakras/${slug}.svg`;
  return (
    <div className="mt-6 flex flex-col items-center">
      <img src={src} alt={`${chakra} glyph`} className="w-32 opacity-70 hover:opacity-100 transition duration-300" />
      <p className="text-center text-sm text-gray-400 mt-2">{chakra} Glyph</p>
    </div>
  );
}
