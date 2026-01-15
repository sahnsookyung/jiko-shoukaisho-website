# Resume (じこしょうかいしょ) (자기소개서)
Hi! This is "me".

## How this was built.

### Images 
1. Nano banana prompt searching to come up with a design that I like.
2. Use Vtracer to generate SVGs from the jpeg so we can have near lossless quality when zooming.
3. Minify svg using `svgo`[https://github.com/svg/svgo]
4. Use inkscape to create layers. Used spline and bezier to create the shapes. The layers are overlayed with100% opacity but will be set to zero in css.

5. The overlays we created have the following property:
```
<g id="interactive-overlays" transform="translate(-240.53 34.688)">
  <g id="iceland-mountains" style="fill-opacity:.5;fill:#0ff">
   <path id="1-iceland-mountain" d="" style="fill-opacity:.5;fill:#0ff"/>
   <path id="2-iceland-mountain" d="" style="fill-opacity:.5;fill:#0ff"/>
   <path id="3-iceland-mountain" d="" style="fill-opacity:.5;fill:#0ff"/>
   <path id="4-iceland-mountain" d="" style="fill-opacity:.5;fill:#0ff"/>
   <path id="5-iceland-mountain" d="" style="fill-opacity:.50196;fill:#0ff"/>
   <path id="6-iceland-mountain" d="" style="fill-opacity:.50196;fill:#0ff"/>
   <path id="7-iceland-mountain" d="" style="fill-opacity:.50196;fill:#0ff"/>
   <path id="8-iceland-mountain" d="" style="fill-opacity:.50196;fill:#0ff"/>
   <path id="9-iceland-mountain" d="" style="fill-opacity:.50196;fill:#0ff"/>
   <path id="10-iceland-mountain" d="" style="fill-opacity:.50196;fill:#0ff"/>
   <path id="11-iceland-mountain" d="" style="fill-opacity:.50196;fill:#0ff"/>
  </g>
  <g id="europe">
   <path id="1-europe" d="" style="fill-opacity:.5;fill:#00f"/>
   <path id="2-europe" d="" style="fill-opacity:.5;fill:#00f"/>
  </g>
  <path id="person" d="" style="fill-opacity:.5;fill:#666"/>
  <path id="japan" d="" style="fill-opacity:.5;fill:#ff8080"/>
  <path id="philosopher" d="" style="fill-opacity:.5;fill:#e5ff80"/>
  <g id="plane-skydiver" transform="translate(240.53 -34.688)">
   <path id="skydiver" transform="translate(-240.53 34.688)" d="" style="fill-opacity:.50196;fill:#008080"/>
   <path id="plane" transform="translate(-240.53 34.688)" d="" style="fill-opacity:.50196;fill:#008080"/>
  </g>
  <path id="scroll" d="" style="fill-opacity:.50196;fill:#f95"/>
 </g>
```