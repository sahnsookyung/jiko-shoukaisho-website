# Resume (じこしょうかいしょ) (자기소개서)
Hi! This is "me".

## How this was built.

### Images 
1. Nano banana prompt searching to come up with a design that I like.
2. Use Vtracer to generate SVGs from the jpeg so we can have near lossless quality when zooming.
3. Minify svg using `svgo`[https://github.com/svg/svgo]
4. Use inkscape to create layers. Used spline and bezier to create the shapes. The layers are overlayed with100% opacity but will be set to zero in css.
5. Optimize the vector paths (reduce nodecount) in Inkscape (`Inkscape: Path > Simplify (Ctrl + L)`). This yields some drastic reductions ~80+% in size.
  5.1. We could further reduce filesize by reducing the precision of the decimals, but this is already workable so we left it.