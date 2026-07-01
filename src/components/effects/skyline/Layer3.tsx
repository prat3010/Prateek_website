'use client';

import React from 'react';
import styles from '../NoirSkyline.module.css';
import { WobblyPath, WobblyLine, WobblyRect, WobblyPolygon } from '../WobblySVG';
import { LayerProps } from './types';
import RunningCat from './RunningCat';
import InteractiveGargoyle from './InteractiveGargoyle';
import BillboardPigeon from './BillboardPigeon';
import FirePigeon from './FirePigeon';

const Layer3 = React.memo(function Layer3({ reducedMotion }: LayerProps) {
  const wobble = !reducedMotion;
  const strength = 4.0; // Heavy foreground wobbly brush style
  return (
    <>
      {/* Static Layer */}
      <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMax slice" className={styles.staticLayerSvg} style={{ width: '100%', height: '100%', overflow: 'visible', position: 'absolute', inset: 0 }}>
            <defs>
              {/* Fog Mist Vertical Linear Gradient */}
              <linearGradient id="fogGradient" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="rgba(250, 250, 250, 0.15)" />
                <stop offset="50%" stopColor="rgba(250, 250, 250, 0.06)" />
                <stop offset="100%" stopColor="rgba(250, 250, 250, 0)" />
              </linearGradient>

              {/* Downward Light Bulb Gradient */}
              <linearGradient id="downwardLightGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(255, 255, 255, 0.55)" />
                <stop offset="50%" stopColor="rgba(255, 255, 255, 0.2)" />
                <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
              </linearGradient>

              {/* Downward Light Bulb Gradient Popart */}
              <linearGradient id="downwardLightGradPopart" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(255, 234, 0, 0.5)" />
                <stop offset="50%" stopColor="rgba(255, 234, 0, 0.15)" />
                <stop offset="100%" stopColor="rgba(255, 234, 0, 0)" />
              </linearGradient>

              {/* Billboard Spotlight Gradient */}
              <linearGradient id="leftLightGrad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="rgba(250, 250, 250, 0.15)" />
                <stop offset="60%" stopColor="rgba(250, 250, 250, 0.04)" />
                <stop offset="100%" stopColor="rgba(250, 250, 250, 0)" />
              </linearGradient>

              {/* Billboard Spotlight Gradient Popart */}
              <linearGradient id="leftLightGradPopart" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="rgba(255, 64, 129, 0.25)" />
                <stop offset="60%" stopColor="rgba(255, 64, 129, 0.06)" />
                <stop offset="100%" stopColor="rgba(255, 64, 129, 0)" />
              </linearGradient>

              <pattern id="hatch-fg" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(250, 250, 250, 0.22)" strokeWidth="1.2" />
              </pattern>

              <pattern id="hatch-fg-black" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(26, 26, 46, 0.22)" strokeWidth="1.2" />
              </pattern>
              
              {/* River Gradients */}
              <linearGradient id="riverGradPopart" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A1DEDC" />
                <stop offset="100%" stopColor="#7FB3D5" />
              </linearGradient>
              <linearGradient id="riverGradNoir" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#111116" />
                <stop offset="100%" stopColor="#070709" />
              </linearGradient>

              {/* Brick Mortar pattern */}
              <pattern id="brick-fg" width="24" height="12" patternUnits="userSpaceOnUse">
                {/* Horizontal mortar lines */}
                <line x1="0" y1="6" x2="24" y2="6" stroke="var(--skyline-mortar-stroke)" strokeWidth="0.8" />
                <line x1="0" y1="12" x2="24" y2="12" stroke="var(--skyline-mortar-stroke)" strokeWidth="0.8" />
                {/* Vertical joints (Staggered row 1) */}
                <line x1="12" y1="0" x2="12" y2="6" stroke="var(--skyline-mortar-stroke)" strokeWidth="0.8" />
                {/* Vertical joints (Staggered row 2) */}
                <line x1="0" y1="6" x2="0" y2="12" stroke="var(--skyline-mortar-stroke)" strokeWidth="0.8" />
                <line x1="24" y1="6" x2="24" y2="12" stroke="var(--skyline-mortar-stroke)" strokeWidth="0.8" />
              </pattern>
            </defs>

             {/* Group A: Foreground Static Elements (Wobbled for hand-drawn look) */}
            <g className={styles.buildingGroup} stroke="var(--skyline-stroke-fg)" strokeWidth="1.8">
              
              {/* LEFT ROOFTOP SECTION */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M -1000 1250 L -1000 820 L 460 820 L 460 1250 Z" className={styles.bldFgLeftRoof} />
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M -1000 1250 L -1000 820 L 460 820 L 460 1250 Z" fill="url(#brick-fg)" stroke="none" pointerEvents="none" className={styles.brickOverlay} />

              {/* Utility cable on left roof */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 345 755 Q 362 762 380 748" fill="none" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" />

              {/* Left Rooftop Graffiti Tag */}
              <g className={styles.rooftopGraffiti}>
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 312 872 L 306 860 L 316 868 Z" fill="none" />
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 328 872 L 334 860 L 324 868 Z" fill="none" />
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 310 872 C 310 880, 330 880, 330 872 C 330 864, 310 864, 310 872 Z" fill="none" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="305" y1="872" x2="299" y2="871" fill="none" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="305" y1="875" x2="298" y2="876" fill="none" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="335" y1="872" x2="341" y2="871" fill="none" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="335" y1="875" x2="342" y2="876" fill="none" />
                <path d="M 308 887 L 308 893 L 313 887 L 313 893 Z" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" fill="none" />
                <path d="M 317 887 A 3 3 0 0 0 323 887 A 3 3 0 0 0 317 887 Z" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" fill="none" />
                <path d="M 326 887 L 326 893 M 326 887 L 330 887 L 330 893" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" fill="none" />
                <path d="M 333 887 L 333 893 M 333 887 H 337 V 890 H 333 M 335 890 L 338 893" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" fill="none" />
              </g>

              {/* Left Parapet Brick Mortar Lines (Removed) */}
              
              {/* Retro TV Yagi Antenna on left rooftop */}
              <g stroke="var(--skyline-stroke-fg)" strokeWidth="1.5" fill="none">
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="440" y1="820" x2="440" y2="750" />
                {/* Crossbars */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="425" y1="760" x2="455" y2="760" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="429" y1="772" x2="451" y2="772" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="433" y1="784" x2="447" y2="784" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="436" y1="796" x2="444" y2="796" />
              </g>

              {/* Laundry line between access shed and Yagi antenna */}
              <g stroke="var(--skyline-stroke-mid)" fill="none" strokeWidth="0.8">
                {/* Sagging line */}
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 357 770 Q 398 782 440 770" />
                {/* Clothes hanging */}
                {/* Shirt 1 */}
                <path d="M 373 777 L 377 777 L 379 788 L 371 788 Z" fill="var(--skyline-fill-bg)" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" />
                <line x1="374.5" y1="774" x2="374.5" y2="777" />
                <line x1="375.5" y1="774" x2="375.5" y2="777" />
                {/* Pants 1 */}
                <path d="M 389 780 L 397 780 L 397 795 L 394 795 L 393 786 L 392 795 L 389 795 Z" fill="var(--skyline-fill-bg)" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" />
                <line x1="390" y1="778" x2="390" y2="780" />
                <line x1="396" y1="778" x2="396" y2="780" />
                {/* Shirt 2 */}
                <path d="M 411 776 L 415 776 L 417 787 L 409 787 Z" fill="var(--skyline-fill-bg)" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" />
                <line x1="412.5" y1="773" x2="412.5" y2="776" />
                <line x1="413.5" y1="773" x2="413.5" y2="776" />
              </g>

              {/* Rooftop Water Puddle on left rooftop */}
              <ellipse cx="150" cy="820" rx="28" ry="2.5" fill="var(--skyline-puddle-fill)" stroke="var(--skyline-puddle-stroke)" strokeWidth="0.8" />
              {/* Puddle beacon reflection */}
              <ellipse cx="145" cy="820" rx="3" ry="0.6" fill="#ff3b30" opacity="0.3" filter="blur(1px)" />

              {/* Left Rooftop Water Tank */}
              <g>
                {/* Trestle Support Legs */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="381" y1="820" x2="384" y2="792" strokeWidth="1.2" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="411" y1="820" x2="408" y2="792" strokeWidth="1.2" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="391" y1="820" x2="393" y2="792" strokeWidth="0.8" opacity="0.6" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="401" y1="820" x2="399" y2="792" strokeWidth="0.8" opacity="0.6" />
                
                {/* Cross Bracing */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="384" y1="792" x2="409" y2="806" strokeWidth="0.8" opacity="0.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="408" y1="792" x2="383" y2="806" strokeWidth="0.8" opacity="0.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="383" y1="806" x2="411" y2="820" strokeWidth="0.8" opacity="0.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="409" y1="806" x2="381" y2="820" strokeWidth="0.8" opacity="0.5" />
                
                {/* Horizontal Struts */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="383" y1="806" x2="409" y2="806" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="382" y1="792" x2="410" y2="792" strokeWidth="1.6" />
                
                {/* Center Pipe */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="396" y1="792" x2="396" y2="820" strokeWidth="2.2" />
                
                {/* Tank Barrel Body */}
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="380" y="748" width="32" height="44" className={styles.bldFgLeftWaterTankBody} />
                
                {/* Vertical Staves (Planks) */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="384" y1="748" x2="384" y2="792" strokeWidth="0.6" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="388" y1="748" x2="388" y2="792" strokeWidth="0.6" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="392" y1="748" x2="392" y2="792" strokeWidth="0.6" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="396" y1="748" x2="396" y2="792" strokeWidth="0.6" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="400" y1="748" x2="400" y2="792" strokeWidth="0.6" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="404" y1="748" x2="404" y2="792" strokeWidth="0.6" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="408" y1="748" x2="408" y2="792" strokeWidth="0.6" stroke="var(--skyline-stroke-fine)" />
                
                {/* Horizontal Steel Hoops */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="380" y1="753" x2="412" y2="753" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="380" y1="762" x2="412" y2="762" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="380" y1="771" x2="412" y2="771" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="380" y1="779" x2="412" y2="779" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="380" y1="786" x2="412" y2="786" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="380" y1="790" x2="412" y2="790" strokeWidth="0.8" />
                
                {/* Conical Roof */}
                <WobblyPolygon wobble={wobble} wobbleStrength={strength} points="378,748 396,726 414,748" className={styles.bldFgLeftWaterTankRoof} />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="396" y1="726" x2="378" y2="748" strokeWidth="0.8" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="396" y1="726" x2="384" y2="748" strokeWidth="0.8" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="396" y1="726" x2="390" y2="748" strokeWidth="0.8" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="396" y1="726" x2="396" y2="748" strokeWidth="0.8" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="396" y1="726" x2="402" y2="748" strokeWidth="0.8" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="396" y1="726" x2="408" y2="748" strokeWidth="0.8" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="396" y1="726" x2="414" y2="748" strokeWidth="0.8" stroke="var(--skyline-stroke-fine)" />
                
                {/* Finial Peak */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="396" y1="726" x2="396" y2="718" strokeWidth="1.2" />
                <circle cx="396" cy="718" r="1.2" fill="var(--skyline-stroke-fg)" stroke="none" />

                {/* Perched Pigeons */}
                <g fill="var(--skyline-stroke-fg)" stroke="none">
                  {/* Pigeon on water tank roof peak */}
                  <path d="M 395 726 C 395 724 396 723 398 723 C 399 723 400 724 400 726 C 400 727 398 728 397 728 Z M 399 725 L 401 727 L 399 728 Z" />
                  {/* Pigeon on access shed roof */}
                  <path d="M 329 750 C 329 748 330 747 332 747 C 333 747 334 748 334 750 C 334 751 332 752 331 752 Z M 333 749 L 335 751 L 333 752 Z" />
                </g>

                {/* Left rooftop satellite dish */}
                <g stroke="var(--skyline-stroke-fg)" strokeWidth="1.2" fill="none">
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="270" y1="820" x2="273" y2="806" />
                  <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 264 800 A 8 8 0 0 1 282 808" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="273" y1="806" x2="276" y2="800" />
                </g>
                
                {/* Side Ladder */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="375" y1="795" x2="375" y2="744" strokeWidth="0.8" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="378" y1="795" x2="378" y2="744" strokeWidth="0.8" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="375" y1="748" x2="378" y2="748" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="375" y1="752" x2="378" y2="752" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="375" y1="756" x2="378" y2="756" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="375" y1="760" x2="378" y2="760" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="375" y1="764" x2="378" y2="764" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="375" y1="768" x2="378" y2="768" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="375" y1="772" x2="378" y2="772" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="375" y1="776" x2="378" y2="776" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="375" y1="780" x2="378" y2="780" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="375" y1="784" x2="378" y2="784" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="375" y1="788" x2="378" y2="788" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="375" y1="792" x2="378" y2="792" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
              </g>


              {/* Slanted Glass Skylight */}
              <g fill="var(--bld-fg-left-fill)" stroke="var(--skyline-stroke-fg)" strokeWidth="1.2">
                <WobblyPolygon wobble={wobble} wobbleStrength={strength} points="255,820 255,805 285,812 285,820" />
                {/* Glass pane partitions */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="265" y1="810" x2="265" y2="820" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="275" y1="815" x2="275" y2="820" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" />
                {/* Internal glow / light rays shining out */}
                <WobblyPolygon wobble={wobble} wobbleStrength={strength} points="255,805 240,750 300,750 285,812" fill="var(--skyline-light-ray)" stroke="none" />
              </g>

              {/* Detective Billboard Support Frame & Sign (Static) */}
              <g>
                {/* Scaffold support frame */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="90" y1="820" x2="98" y2="760" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="170" y1="820" x2="162" y2="760" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="98" y1="760" x2="162" y2="760" stroke="var(--skyline-stroke-mid)" strokeWidth="1" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="98" y1="760" x2="170" y2="820" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" opacity="0.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="162" y1="760" x2="90" y2="820" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" opacity="0.5" />

                {/* Sign Board */}
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="80" y="700" width="100" height="60" rx="3" fill="var(--skyline-billboard-bg)" stroke="var(--skyline-stroke-fg)" strokeWidth="1.8" />
                {/* Border line */}
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="84" y="704" width="92" height="52" fill="none" strokeWidth="0.8" stroke="var(--skyline-stroke-mid)" />
              </g>

              {/* Rooftop Penthouse Brick Access Shed (Static part) */}
              <g className={styles.bldFgShed} stroke="var(--skyline-stroke-fg)" strokeWidth="1.8">
                {/* Main Shed Structure */}
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="290" y="750" width="65" height="70" />
                {/* Roof Cap */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="288" y1="750" x2="357" y2="750" />
                
                {/* Brick Mortar Details inside Shed (Removed) */}

                {/* Wooden Access Door */}
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="304" y="771" width="24" height="49" fill="var(--skyline-shed-door)" stroke="var(--skyline-stroke-fg)" strokeWidth="1.2" />
                {/* Inset Panels */}
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="308" y="776" width="16" height="17" fill="none" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" />
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="308" y="797" width="16" height="19" fill="none" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" />
                
                {/* Vintage Keyhole */}
                <circle cx="323" cy="798" r="1.2" fill="var(--skyline-stroke-fg)" stroke="none" />
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 322.5 798 L 321.5 801.5 L 324.5 801.5 Z" fill="var(--skyline-stroke-fg)" stroke="none" />

                {/* Light fixture */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="316" y1="750" x2="316" y2="762" stroke="var(--skyline-stroke-mid)" strokeWidth="1.0" />
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="314" y="762" width="4" height="3" stroke="var(--skyline-stroke-fg)" strokeWidth="0.8" />
                <circle cx="316" cy="767" r="2.2" fill="var(--skyline-bulb-glow)" stroke="none" />
                <circle cx="316" cy="767" r="2.6" fill="none" stroke="var(--skyline-stroke-fg)" strokeWidth="0.5" />
                {/* Light cone casting downwards */}
                <WobblyPolygon wobble={wobble} wobbleStrength={strength} points="316,769 292,820 340,820" fill="var(--skyline-downward-light)" stroke="none" />
              </g>

              {/* Dripping copper utility pipe from shed wall to puddle */}
              <g stroke="var(--skyline-stroke-mid)" strokeWidth="1.5" fill="none">
                {/* Vertical pipe section running down the shed wall */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="290" y1="780" x2="290" y2="795" />
                {/* Horizontal pipe section running along the roof */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="290" y1="795" x2="150" y2="795" />
                {/* Downward bend/nozzle pointing at puddle */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="150" y1="795" x2="150" y2="805" />
              </g>

              {/* Parapet Wall Cap details on left roof */}
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="-1000" y1="826" x2="460" y2="826" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="40" y1="820" x2="40" y2="1250" stroke="var(--skyline-stroke-fine)" strokeWidth="1" />
              
              {/* Left Facade Fire Escape */}
              <g stroke="var(--skyline-stroke-fg)" strokeWidth="1.2" fill="none">
                {/* Vertical support rails */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="175" y1="820" x2="175" y2="1080" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="210" y1="820" x2="210" y2="1080" />
                
                {/* Platform 1 (y=860) */}
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="170" y="860" width="45" height="5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="170" y1="850" x2="215" y2="850" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="170" y1="850" x2="170" y2="860" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="215" y1="850" x2="215" y2="860" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="180" y1="850" x2="180" y2="860" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="190" y1="850" x2="190" y2="860" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="200" y1="850" x2="200" y2="860" />

                {/* Platform 2 (y=940) */}
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="170" y="940" width="45" height="5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="170" y1="930" x2="215" y2="930" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="170" y1="930" x2="170" y2="940" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="215" y1="930" x2="215" y2="940" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="180" y1="930" x2="180" y2="940" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="190" y1="930" x2="190" y2="940" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="200" y1="930" x2="200" y2="940" />

                {/* Platform 3 (y=1020) */}
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="170" y="1020" width="45" height="5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="170" y1="1010" x2="215" y2="1010" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="170" y1="1010" x2="170" y2="1020" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="215" y1="1010" x2="215" y2="1020" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="180" y1="1010" x2="180" y2="1020" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="190" y1="1010" x2="190" y2="1020" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="200" y1="1010" x2="200" y2="1020" />

                {/* Diagonal stairs 1 (y=865 to 930) */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="210" y1="865" x2="175" y2="930" strokeWidth="1.6" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="210" y1="873" x2="175" y2="938" strokeWidth="0.8" />
                {/* Diagonal stairs 2 (y=945 to 1010) */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="175" y1="945" x2="210" y2="1010" strokeWidth="1.6" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="175" y1="953" x2="210" y2="1018" strokeWidth="0.8" />
              </g>

              {/* Localized brick textures on left facade */}
              <g stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" fill="none" opacity="0.5">
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="320" y1="950" x2="335" y2="950" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="325" y1="956" x2="340" y2="956" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="318" y1="962" x2="330" y2="962" />
              </g>

              {/* Decorative Window Cornices / Pediments */}
              <g stroke="var(--skyline-stroke-fg)" strokeWidth="1.2" fill="none">
                <WobblyPolygon wobble={wobble} wobbleStrength={strength} points="48,842 61,835 74,842" />
                <WobblyPolygon wobble={wobble} wobbleStrength={strength} points="128,842 141,835 154,842" />
                <WobblyPolygon wobble={wobble} wobbleStrength={strength} points="358,842 371,835 384,842" />
              </g>

              {/* Window Blinds */}
              <g stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" fill="none" opacity="0.6">
                {/* Arched Window 2 blinds */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="92" y1="854" x2="110" y2="854" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="92" y1="858" x2="110" y2="858" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="92" y1="862" x2="110" y2="862" />
                {/* Arched Window 5 blinds */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="237" y1="854" x2="255" y2="854" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="237" y1="858" x2="255" y2="858" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="237" y1="862" x2="255" y2="862" />
                {/* Rectangular Window 9 blinds */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="394" y1="899" x2="408" y2="899" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="394" y1="903" x2="408" y2="903" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="394" y1="907" x2="408" y2="907" />
              </g>

              {/* Human silhouette inside arched window 5 */}
              <path d="M 241 878 C 241 872 243 870 246 870 C 249 870 251 872 251 878 Z M 244 870 A 2 2 0 1 1 248 870 A 2 2 0 1 1 244 870 M 241 876 Q 244 875 246 875 Q 248 875 251 876" fill="var(--skyline-fill-bg)" stroke="var(--skyline-stroke-mid)" strokeWidth="0.6" />

              {/* ── LEFT FACADE WINDOWS (Arched Top Row + Rectangular Grid) ── */}
              <g fill="var(--skyline-window-dark-fill)">
                {/* Row 1: Arched windows just below the parapet (y=840-870) */}
                <g stroke="var(--skyline-stroke-mid)" strokeWidth="1.2">
                  {/* Arched window 1 */}
                  <g className={styles.interactiveWindowGroup}>
                    <WobblyRect wobble={wobble} wobbleStrength={strength} x="50" y="850" width="22" height="28" />
                    <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 50 850 A 11 11 0 0 1 72 850" />
                  </g>
                  {/* Arched window 2 */}
                  <g className={`${styles.interactiveWindowGroup} ${styles.glowingForegroundWindowCyan}`}>
                    <WobblyRect wobble={wobble} wobbleStrength={strength} x="90" y="850" width="22" height="28" />
                    <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 90 850 A 11 11 0 0 1 112 850" />
                  </g>
                  {/* Arched window 3 */}
                  <g className={styles.interactiveWindowGroup}>
                    <WobblyRect wobble={wobble} wobbleStrength={strength} x="130" y="850" width="22" height="28" />
                    <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 130 850 A 11 11 0 0 1 152 850" />
                  </g>
                  {/* Arched window 4 */}
                  <g className={styles.interactiveWindowGroup}>
                    <WobblyRect wobble={wobble} wobbleStrength={strength} x="195" y="850" width="22" height="28" />
                    <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 195 850 A 11 11 0 0 1 217 850" />
                  </g>
                  {/* Arched window 5 */}
                  <g className={`${styles.interactiveWindowGroup} ${styles.glowingForegroundWindowPink}`}>
                    <WobblyRect wobble={wobble} wobbleStrength={strength} x="235" y="850" width="22" height="28" />
                    <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 235 850 A 11 11 0 0 1 257 850" />
                  </g>
                  {/* Arched window 6 */}
                  <g className={styles.interactiveWindowGroup}>
                    <WobblyRect wobble={wobble} wobbleStrength={strength} x="360" y="850" width="22" height="28" />
                    <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 360 850 A 11 11 0 0 1 382 850" />
                  </g>
                  {/* Arched window 7 */}
                  <g className={styles.interactiveWindowGroup}>
                    <WobblyRect wobble={wobble} wobbleStrength={strength} x="400" y="850" width="22" height="28" />
                    <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 400 850 A 11 11 0 0 1 422 850" />
                  </g>
                </g>

                {/* Window curtains */}
                <g fill="var(--skyline-stroke-mid)" stroke="none" opacity="0.5">
                  {/* Window 1 curtains */}
                  <path d="M 50 895 L 56 895 L 50 910 Z" />
                  <path d="M 68 895 L 62 895 L 68 910 Z" />
                  {/* Window 3 curtains */}
                  <path d="M 114 895 L 120 895 L 114 910 Z" />
                  <path d="M 132 895 L 126 895 L 132 910 Z" />
                </g>

                {/* Window box plants */}
                <g stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" fill="none">
                  {/* Window 4 plant box */}
                  <rect x="144" y="917" width="22" height="3" fill="var(--skyline-fill-bg)" />
                  {/* Leaves */}
                  <path d="M 146 917 Q 148 912 151 915 Q 153 912 155 916 Q 158 913 160 917" />
                </g>

                {/* Row 2: Rectangular windows (y=895-920) */}
                <g stroke="var(--skyline-stroke-mid)" strokeWidth="1.0">
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="50" y="895" width="18" height="22" />
                  <WobblyRect className={`${styles.interactiveWindow} ${styles.glowingForegroundWindowPink}`} wobble={wobble} wobbleStrength={strength} x="82" y="895" width="18" height="22" />
                  {/* Cat Silhouette in window */}
                  <path d="M 87 917 C 87 909 89 907 91 907 C 93 907 95 909 95 917 Z M 88.5 907 L 87.5 903 L 90.5 906 Z M 91.5 906 L 94.5 903 L 93.5 907 Z M 95 915 Q 98 911 98 906" fill="var(--skyline-fill-bg)" stroke="var(--skyline-stroke-mid)" strokeWidth="0.5" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="114" y="895" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="146" y="895" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="200" y="895" width="18" height="22" />
                  {/* Potted Plant Silhouette in window */}
                  <path d="M 206 917 L 207 912 L 211 912 L 212 917 Z M 209 912 Q 205 902 201 905 M 209 912 Q 209 898 209 899 M 209 912 Q 213 902 217 905" fill="var(--skyline-fill-bg)" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="232" y="895" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="360" y="895" width="18" height="22" />
                  <WobblyRect className={`${styles.interactiveWindow} ${styles.glowingForegroundWindowCyan}`} wobble={wobble} wobbleStrength={strength} x="392" y="895" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="424" y="895" width="18" height="22" />
                  {/* Window mullions (center vertical bars) */}
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="59" y1="895" x2="59" y2="917" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="91" y1="895" x2="91" y2="917" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="123" y1="895" x2="123" y2="917" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="155" y1="895" x2="155" y2="917" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="209" y1="895" x2="209" y2="917" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="241" y1="895" x2="241" y2="917" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="369" y1="895" x2="369" y2="917" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="401" y1="895" x2="401" y2="917" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="433" y1="895" x2="433" y2="917" strokeWidth="0.6" />
                </g>

                {/* Row 3: Rectangular windows (y=940-962) */}
                <g stroke="var(--skyline-stroke-mid)" strokeWidth="1.0">
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="50" y="940" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="82" y="940" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="114" y="940" width="18" height="22" />
                  <WobblyRect className={`${styles.interactiveWindow} ${styles.glowingForegroundWindowYellow}`} wobble={wobble} wobbleStrength={strength} x="146" y="940" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="200" y="940" width="18" height="22" />
                  <WobblyRect className={`${styles.interactiveWindow} ${styles.glowingForegroundWindowPink}`} wobble={wobble} wobbleStrength={strength} x="232" y="940" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="360" y="940" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="392" y="940" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="424" y="940" width="18" height="22" />
                  {/* Mullions */}
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="59" y1="940" x2="59" y2="962" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="91" y1="940" x2="91" y2="962" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="123" y1="940" x2="123" y2="962" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="155" y1="940" x2="155" y2="962" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="209" y1="940" x2="209" y2="962" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="241" y1="940" x2="241" y2="962" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="369" y1="940" x2="369" y2="962" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="401" y1="940" x2="401" y2="962" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="433" y1="940" x2="433" y2="962" strokeWidth="0.6" />
                </g>

                {/* Row 4: Rectangular windows (y=985-1007) */}
                <g stroke="var(--skyline-stroke-mid)" strokeWidth="1.0">
                  <WobblyRect className={`${styles.interactiveWindow} ${styles.glowingForegroundWindowCyan}`} wobble={wobble} wobbleStrength={strength} x="50" y="985" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="82" y="985" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="114" y="985" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="146" y="985" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="200" y="985" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="232" y="985" width="18" height="22" />
                  <WobblyRect className={`${styles.interactiveWindow} ${styles.glowingForegroundWindowYellow}`} wobble={wobble} wobbleStrength={strength} x="360" y="985" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="392" y="985" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="424" y="985" width="18" height="22" />
                  {/* Mullions */}
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="59" y1="985" x2="59" y2="1007" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="91" y1="985" x2="91" y2="1007" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="123" y1="985" x2="123" y2="1007" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="155" y1="985" x2="155" y2="1007" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="209" y1="985" x2="209" y2="1007" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="241" y1="985" x2="241" y2="1007" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="369" y1="985" x2="369" y2="1007" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="401" y1="985" x2="401" y2="1007" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="433" y1="985" x2="433" y2="1007" strokeWidth="0.6" />
                </g>

                {/* Row 5: Rectangular windows (y=1030-1052) */}
                <g stroke="var(--skyline-stroke-mid)" strokeWidth="1.0">
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="50" y="1030" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="82" y="1030" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="114" y="1030" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="146" y="1030" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="200" y="1030" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="232" y="1030" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="360" y="1030" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="392" y="1030" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="424" y="1030" width="18" height="22" />
                  {/* Mullions */}
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="59" y1="1030" x2="59" y2="1052" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="91" y1="1030" x2="91" y2="1052" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="123" y1="1030" x2="123" y2="1052" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="155" y1="1030" x2="155" y2="1052" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="209" y1="1030" x2="209" y2="1052" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="241" y1="1030" x2="241" y2="1052" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="369" y1="1030" x2="369" y2="1052" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="401" y1="1030" x2="401" y2="1052" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="433" y1="1030" x2="433" y2="1052" strokeWidth="0.6" />
                </g>

                {/* Row 6: Rectangular windows (y=1075-1097) */}
                <g stroke="var(--skyline-stroke-mid)" strokeWidth="1.0">
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="50" y="1075" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="82" y="1075" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="114" y="1075" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="146" y="1075" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="200" y="1075" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="232" y="1075" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="360" y="1075" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="392" y="1075" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="424" y="1075" width="18" height="22" />
                  {/* Mullions */}
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="59" y1="1075" x2="59" y2="1097" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="91" y1="1075" x2="91" y2="1097" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="123" y1="1075" x2="123" y2="1097" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="155" y1="1075" x2="155" y2="1097" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="209" y1="1075" x2="209" y2="1097" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="241" y1="1075" x2="241" y2="1097" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="369" y1="1075" x2="369" y2="1097" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="401" y1="1075" x2="401" y2="1097" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="433" y1="1075" x2="433" y2="1097" strokeWidth="0.6" />
                </g>

                {/* Row 7: Rectangular windows (y=1120-1142) */}
                <g stroke="var(--skyline-stroke-mid)" strokeWidth="1.0">
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="50" y="1120" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="82" y="1120" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="114" y="1120" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="146" y="1120" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="200" y="1120" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="232" y="1120" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="360" y="1120" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="392" y="1120" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="424" y="1120" width="18" height="22" />
                  {/* Mullions */}
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="59" y1="1120" x2="59" y2="1142" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="91" y1="1120" x2="91" y2="1142" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="123" y1="1120" x2="123" y2="1142" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="155" y1="1120" x2="155" y2="1142" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="209" y1="1120" x2="209" y2="1142" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="241" y1="1120" x2="241" y2="1142" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="369" y1="1120" x2="369" y2="1142" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="401" y1="1120" x2="401" y2="1142" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="433" y1="1120" x2="433" y2="1142" strokeWidth="0.6" />
                </g>
                {/* Left Facade Row 1 Window Decorations (Arched) */}
                <g fill="none">
                  <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 90 850 L 96 850 Q 93 861 92 872 L 90 872 Z" fill="var(--skyline-window-deco-fill)" stroke="var(--skyline-window-deco-stroke)" strokeWidth={0.4} />
                  <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 108 850 L 102 850 Q 105 861 106 872 L 108 872 Z" fill="var(--skyline-window-deco-fill)" stroke="var(--skyline-window-deco-stroke)" strokeWidth={0.4} />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="130" y="850" width="22" height="28" fill="var(--skyline-window-deco-fill)" stroke="none" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="130" y1="855" x2="152" y2="855" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="130" y1="860" x2="152" y2="860" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="130" y1="865" x2="152" y2="865" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="130" y1="870" x2="152" y2="870" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="130" y1="875" x2="152" y2="875" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 235 850 L 241 850 Q 238 861 237 872 L 235 872 Z" fill="var(--skyline-window-deco-fill)" stroke="var(--skyline-window-deco-stroke)" strokeWidth={0.4} />
                  <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 253 850 L 247 850 Q 250 861 251 872 L 253 872 Z" fill="var(--skyline-window-deco-fill)" stroke="var(--skyline-window-deco-stroke)" strokeWidth={0.4} />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="360" y="850" width="22" height="28" fill="var(--skyline-window-deco-fill)" stroke="none" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="360" y1="855" x2="382" y2="855" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="360" y1="860" x2="382" y2="860" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="360" y1="865" x2="382" y2="865" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="360" y1="870" x2="382" y2="870" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="360" y1="875" x2="382" y2="875" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                </g>

                {/* Left Facade Row Decorations (y=895) */}
                <g fill="none">
                  {/* Col 0 (x=50): SCL */}
                  <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 50 895 L 57 895 Q 54 906 52 917 L 50 917 Z" fill="var(--skyline-window-deco-fill)" stroke="var(--skyline-window-deco-stroke)" strokeWidth={0.4} />
                  {/* Col 2 (x=114): HDB */}
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="114" y="895" width="18" height="11" fill="var(--skyline-window-deco-fill)" stroke="none" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="114" y1="898" x2="132" y2="898" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="114" y1="901" x2="132" y2="901" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="114" y1="904" x2="132" y2="904" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="114" y1="906" x2="132" y2="906" strokeWidth={0.8} stroke="var(--skyline-window-deco-stroke)" />
                  {/* Col 4 (x=200): FCB */}
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="200" y="895" width="18" height="22" fill="var(--skyline-window-deco-fill)" stroke="none" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="200" y1="899" x2="218" y2="899" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="200" y1="903" x2="218" y2="903" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="200" y1="907" x2="218" y2="907" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="200" y1="911" x2="218" y2="911" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="200" y1="915" x2="218" y2="915" strokeWidth="0.5" stroke="var(--skyline-window-deco-stroke)" />
                  {/* Col 6 (x=360): SCR */}
                  <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 378 895 L 371 895 Q 374 906 376 917 L 378 917 Z" fill="var(--skyline-window-deco-fill)" stroke="var(--skyline-window-deco-stroke)" strokeWidth={0.4} />
                  {/* Col 7 (x=392): PS */}
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="392" y="895" width="18" height="13" fill="var(--skyline-window-deco-fill)" stroke="none" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="392" y1="908" x2="410" y2="908" strokeWidth={0.8} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="401" y1="908" x2="401" y2="912" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                </g>

                {/* Left Facade Row Decorations (y=940) */}
                <g fill="none">
                  {/* Col 1 (x=82): FCB */}
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="82" y="940" width="18" height="22" fill="var(--skyline-window-deco-fill)" stroke="none" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="82" y1="944" x2="100" y2="944" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="82" y1="948" x2="100" y2="948" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="82" y1="952" x2="100" y2="952" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="82" y1="956" x2="100" y2="956" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="82" y1="960" x2="100" y2="960" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  {/* Col 3 (x=146): SC */}
                  <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 146 940 L 152 940 Q 149 951 148 962 L 146 962 Z" fill="var(--skyline-window-deco-fill)" stroke="var(--skyline-window-deco-stroke)" strokeWidth={0.4} />
                  <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 164 940 L 158 940 Q 161 951 162 962 L 164 962 Z" fill="var(--skyline-window-deco-fill)" stroke="var(--skyline-window-deco-stroke)" strokeWidth={0.4} />
                  {/* Col 5 (x=232): SCL */}
                  <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 232 940 L 239 940 Q 236 951 234 962 L 232 962 Z" fill="var(--skyline-window-deco-fill)" stroke="var(--skyline-window-deco-stroke)" strokeWidth={0.4} />
                  {/* Col 7 (x=392): HDB */}
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="392" y="940" width="18" height="11" fill="var(--skyline-window-deco-fill)" stroke="none" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="392" y1="943" x2="410" y2="943" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="392" y1="946" x2="410" y2="946" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="392" y1="949" x2="410" y2="949" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="392" y1="951" x2="410" y2="951" strokeWidth={0.8} stroke="var(--skyline-window-deco-stroke)" />
                  {/* Col 8 (x=424): PS */}
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="424" y="940" width="18" height="13" fill="var(--skyline-window-deco-fill)" stroke="none" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="424" y1="953" x2="442" y2="953" strokeWidth={0.8} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="433" y1="953" x2="433" y2="957" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                </g>

                {/* Left Facade Row Decorations (y=985) */}
                <g fill="none">
                  {/* Col 0 (x=50): HDB */}
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="50" y="985" width="18" height="11" fill="var(--skyline-window-deco-fill)" stroke="none" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="50" y1="988" x2="68" y2="988" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="50" y1="991" x2="68" y2="991" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="50" y1="994" x2="68" y2="994" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="50" y1="996" x2="68" y2="996" strokeWidth={0.8} stroke="var(--skyline-window-deco-stroke)" />
                  {/* Col 2 (x=114): SCL */}
                  <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 114 985 L 121 985 Q 118 996 116 1007 L 114 1007 Z" fill="var(--skyline-window-deco-fill)" stroke="var(--skyline-window-deco-stroke)" strokeWidth={0.4} />
                  {/* Col 4 (x=200): PS */}
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="200" y="985" width="18" height="13" fill="var(--skyline-window-deco-fill)" stroke="none" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="200" y1="998" x2="218" y2="998" strokeWidth={0.8} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="209" y1="998" x2="209" y2="1002" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  {/* Col 5 (x=232): FCB */}
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="232" y="985" width="18" height="22" fill="var(--skyline-window-deco-fill)" stroke="none" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="232" y1="989" x2="250" y2="989" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="232" y1="993" x2="250" y2="993" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="232" y1="997" x2="250" y2="997" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="232" y1="1001" x2="250" y2="1001" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="232" y1="1005" x2="250" y2="1005" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  {/* Col 7 (x=392): SC */}
                  <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 392 985 L 398 985 Q 395 996 394 1007 L 392 1007 Z" fill="var(--skyline-window-deco-fill)" stroke="var(--skyline-window-deco-stroke)" strokeWidth={0.4} />
                  <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 410 985 L 404 985 Q 407 996 408 1007 L 410 1007 Z" fill="var(--skyline-window-deco-fill)" stroke="var(--skyline-window-deco-stroke)" strokeWidth={0.4} />
                </g>

                {/* Left Facade Row Decorations (y=1030) */}
                <g fill="none">
                  {/* Col 1 (x=82): SCR */}
                  <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 100 1030 L 93 1030 Q 96 1041 98 1052 L 100 1052 Z" fill="var(--skyline-window-deco-fill)" stroke="var(--skyline-window-deco-stroke)" strokeWidth={0.4} />
                  {/* Col 2 (x=114): FCB */}
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="114" y="1030" width="18" height="22" fill="var(--skyline-window-deco-fill)" stroke="none" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="114" y1="1034" x2="132" y2="1034" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="114" y1="1038" x2="132" y2="1038" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="114" y1="1042" x2="132" y2="1042" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="114" y1="1046" x2="132" y2="1046" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="114" y1="1050" x2="132" y2="1050" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  {/* Col 4 (x=200): HDB */}
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="200" y="1030" width="18" height="11" fill="var(--skyline-window-deco-fill)" stroke="none" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="200" y1="1033" x2="218" y2="1033" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="200" y1="1036" x2="218" y2="1036" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="200" y1="1039" x2="218" y2="1039" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="200" y1="1041" x2="218" y2="1041" strokeWidth={0.8} stroke="var(--skyline-window-deco-stroke)" />
                  {/* Col 6 (x=360): PS */}
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="360" y="1030" width="18" height="13" fill="var(--skyline-window-deco-fill)" stroke="none" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="360" y1="1043" x2="378" y2="1043" strokeWidth={0.8} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="369" y1="1043" x2="369" y2="1047" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  {/* Col 8 (x=424): SCL */}
                  <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 424 1030 L 431 1030 Q 428 1041 426 1052 L 424 1052 Z" fill="var(--skyline-window-deco-fill)" stroke="var(--skyline-window-deco-stroke)" strokeWidth={0.4} />
                </g>

                {/* Left Facade Row Decorations (y=1075) */}
                <g fill="none">
                  {/* Col 0 (x=50): SC */}
                  <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 50 1075 L 56 1075 Q 53 1086 52 1097 L 50 1097 Z" fill="var(--skyline-window-deco-fill)" stroke="var(--skyline-window-deco-stroke)" strokeWidth={0.4} />
                  <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 68 1075 L 62 1075 Q 65 1086 66 1097 L 68 1097 Z" fill="var(--skyline-window-deco-fill)" stroke="var(--skyline-window-deco-stroke)" strokeWidth={0.4} />
                  {/* Col 2 (x=114): PS */}
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="114" y="1075" width="18" height="13" fill="var(--skyline-window-deco-fill)" stroke="none" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="114" y1="1088" x2="132" y2="1088" strokeWidth={0.8} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="123" y1="1088" x2="123" y2="1092" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  {/* Col 3 (x=146): HDB */}
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="146" y="1075" width="18" height="11" fill="var(--skyline-window-deco-fill)" stroke="none" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="146" y1="1078" x2="164" y2="1078" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="146" y1="1081" x2="164" y2="1081" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="146" y1="1084" x2="164" y2="1084" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="146" y1="1086" x2="164" y2="1086" strokeWidth={0.8} stroke="var(--skyline-window-deco-stroke)" />
                  {/* Col 5 (x=232): SCR */}
                  <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 250 1075 L 243 1075 Q 246 1086 248 1097 L 250 1097 Z" fill="var(--skyline-window-deco-fill)" stroke="var(--skyline-window-deco-stroke)" strokeWidth={0.4} />
                  {/* Col 7 (x=392): FCB */}
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="392" y="1075" width="18" height="22" fill="var(--skyline-window-deco-fill)" stroke="none" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="392" y1="1079" x2="410" y2="1079" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="392" y1="1083" x2="410" y2="1083" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="392" y1="1087" x2="410" y2="1087" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="392" y1="1091" x2="410" y2="1091" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="392" y1="1095" x2="410" y2="1095" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                </g>

                {/* Left Facade Row Decorations (y=1120) */}
                <g fill="none">
                  {/* Col 1 (x=82): HDB */}
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="82" y="1120" width="18" height="11" fill="var(--skyline-window-deco-fill)" stroke="none" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="82" y1="1123" x2="100" y2="1123" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="82" y1="1126" x2="100" y2="1126" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="82" y1="1129" x2="100" y2="1129" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="82" y1="1131" x2="100" y2="1131" strokeWidth={0.8} stroke="var(--skyline-window-deco-stroke)" />
                  {/* Col 3 (x=146): FCB */}
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="146" y="1120" width="18" height="22" fill="var(--skyline-window-deco-fill)" stroke="none" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="146" y1="1124" x2="164" y2="1124" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="146" y1="1128" x2="164" y2="1128" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="146" y1="1132" x2="164" y2="1132" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="146" y1="1136" x2="164" y2="1136" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="146" y1="1140" x2="164" y2="1140" strokeWidth={0.5} stroke="var(--skyline-window-deco-stroke)" />
                  {/* Col 4 (x=200): SC */}
                  <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 200 1120 L 206 1120 Q 203 1131 202 1142 L 200 1142 Z" fill="var(--skyline-window-deco-fill)" stroke="var(--skyline-window-deco-stroke)" strokeWidth={0.4} />
                  <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 218 1120 L 212 1120 Q 215 1131 216 1142 L 218 1142 Z" fill="var(--skyline-window-deco-fill)" stroke="var(--skyline-window-deco-stroke)" strokeWidth={0.4} />
                  {/* Col 6 (x=360): SCL */}
                  <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 360 1120 L 367 1120 Q 364 1131 362 1142 L 360 1142 Z" fill="var(--skyline-window-deco-fill)" stroke="var(--skyline-window-deco-stroke)" strokeWidth={0.4} />
                  {/* Col 8 (x=424): SCR */}
                  <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 442 1120 L 435 1120 Q 438 1131 440 1142 L 442 1142 Z" fill="var(--skyline-window-deco-fill)" stroke="var(--skyline-window-deco-stroke)" strokeWidth={0.4} />
                </g>

                {/* Decorative horizontal band / stringcourse between arched and rectangular rows */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="0" y1="885" x2="460" y2="885" stroke="var(--skyline-stroke-mid)" strokeWidth="1.0" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="0" y1="930" x2="460" y2="930" stroke="var(--skyline-mortar-stroke)" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="0" y1="975" x2="460" y2="975" stroke="var(--skyline-mortar-stroke)" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="0" y1="1020" x2="460" y2="1020" stroke="var(--skyline-mortar-stroke)" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="0" y1="1065" x2="460" y2="1065" stroke="var(--skyline-mortar-stroke)" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="0" y1="1110" x2="460" y2="1110" stroke="var(--skyline-mortar-stroke)" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="0" y1="1155" x2="460" y2="1155" stroke="var(--skyline-mortar-stroke)" strokeWidth="0.8" />
              </g>

              {/* ── LEFT FACADE FIRE ESCAPE (Zigzag Staircase) ── */}
              <g stroke="var(--skyline-stroke-mid)" strokeWidth="1.2" fill="none">
                {/* Vertical structural rails (full height) */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="270" y1="830" x2="270" y2="1250" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="340" y1="830" x2="340" y2="1250" />

                {/* Landing platforms (horizontal) */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="268" y1="878" x2="342" y2="878" strokeWidth="1.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="268" y1="925" x2="342" y2="925" strokeWidth="1.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="268" y1="970" x2="342" y2="970" strokeWidth="1.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="268" y1="1015" x2="342" y2="1015" strokeWidth="1.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="268" y1="1060" x2="342" y2="1060" strokeWidth="1.5" />

                {/* Railings (short verticals on each platform) */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="268" y1="870" x2="268" y2="878" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="342" y1="870" x2="342" y2="878" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="268" y1="917" x2="268" y2="925" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="342" y1="917" x2="342" y2="925" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="268" y1="962" x2="268" y2="970" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="342" y1="962" x2="342" y2="970" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="268" y1="1007" x2="268" y2="1015" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="342" y1="1007" x2="342" y2="1015" strokeWidth="0.8" />
                {/* Top railing bars */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="268" y1="870" x2="342" y2="870" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="268" y1="917" x2="342" y2="917" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="268" y1="962" x2="342" y2="962" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="268" y1="1007" x2="342" y2="1007" strokeWidth="0.8" />

                {/* Platform railing details: Mid-rails & Pickets */}
                {[878, 925, 970, 1015].map((y, idx) => {
                  const yTop = idx === 0 ? 870 : idx === 1 ? 917 : idx === 2 ? 962 : 1007;
                  const yMid = yTop + (y - yTop) / 2;
                  const pickets = [274, 281, 288, 295, 302, 309, 316, 323, 330, 337];
                  return (
                    <g key={`left-platform-details-${y}`}>
                      <WobblyLine wobble={wobble} wobbleStrength={strength} x1="268" y1={yMid} x2="342" y2={yMid} strokeWidth="0.6" />
                      {pickets.map(px => (
                        <WobblyLine key={`p-${px}`} wobble={wobble} wobbleStrength={strength} x1={px} y1={yTop} x2={px} y2={y} strokeWidth="0.5" />
                      ))}
                    </g>
                  );
                })}

                {/* Double-stringer Diagonal Staircases with steps, handrails, and supports */}
                {[
                  { y1: 878, y2: 925, x1: 335, x2: 275 },
                  { y1: 925, y2: 970, x1: 275, x2: 335 },
                  { y1: 970, y2: 1015, x1: 335, x2: 275 },
                  { y1: 1015, y2: 1060, x1: 275, x2: 335 }
                ].map((stair, idx) => {
                  const { x1, y1, x2, y2 } = stair;
                  const tVals = [1/6, 2/6, 3/6, 4/6, 5/6];
                  
                  const post1_t = 0.2;
                  const post1_y = y1 + post1_t * (y2 - y1);
                  const post1_x = x1 + post1_t * (x2 - x1);
                  
                  const post2_t = 0.8;
                  const post2_y = y1 + post2_t * (y2 - y1);
                  const post2_x = x1 + post2_t * (x2 - x1);

                  return (
                    <g key={`left-stair-${idx}`}>
                      <WobblyLine wobble={wobble} wobbleStrength={strength} x1={x1 - 3.5} y1={y1} x2={x2 - 3.5} y2={y2} strokeWidth="1.0" />
                      <WobblyLine wobble={wobble} wobbleStrength={strength} x1={x1 + 3.5} y1={y1} x2={x2 + 3.5} y2={y2} strokeWidth="1.0" />
                      {tVals.map((t, stepIdx) => {
                        const yStep = y1 + t * (y2 - y1);
                        const xCent = x1 + t * (x2 - x1);
                        return (
                          <WobblyLine key={`step-${stepIdx}`} wobble={wobble} wobbleStrength={strength} x1={xCent - 3.5} y1={yStep} x2={xCent + 3.5} y2={yStep} strokeWidth="0.8" />
                        );
                      })}
                      <WobblyLine wobble={wobble} wobbleStrength={strength} x1={x1} y1={y1 - 7} x2={x2} y2={y2 - 7} strokeWidth="0.8" />
                      <WobblyLine wobble={wobble} wobbleStrength={strength} x1={post1_x} y1={post1_y} x2={post1_x} y2={post1_y - 7} strokeWidth="0.6" />
                      <WobblyLine wobble={wobble} wobbleStrength={strength} x1={post2_x} y1={post2_y} x2={post2_x} y2={post2_y - 7} strokeWidth="0.6" />
                    </g>
                  );
                })}

                {/* Drop-down retractable bottom ladder segment */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="305" y1="1060" x2="305" y2="1250" strokeWidth="1.0" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="302" y1="1065" x2="308" y2="1065" strokeWidth="0.7" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="302" y1="1070" x2="308" y2="1070" strokeWidth="0.7" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="302" y1="1075" x2="308" y2="1075" strokeWidth="0.7" />

                {/* Bracket supports attaching to wall */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="268" y1="878" x2="262" y2="878" strokeWidth="1.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="268" y1="925" x2="262" y2="925" strokeWidth="1.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="268" y1="970" x2="262" y2="970" strokeWidth="1.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="268" y1="1015" x2="262" y2="1015" strokeWidth="1.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="268" y1="1060" x2="262" y2="1060" strokeWidth="1.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="342" y1="878" x2="348" y2="878" strokeWidth="1.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="342" y1="925" x2="348" y2="925" strokeWidth="1.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="342" y1="970" x2="348" y2="970" strokeWidth="1.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="342" y1="1015" x2="348" y2="1015" strokeWidth="1.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="342" y1="1060" x2="348" y2="1060" strokeWidth="1.5" />
              </g>

              {/* Rooftop Pipe Chimneys with Steam path generators */}
              <WobblyRect wobble={wobble} wobbleStrength={strength} x="220" y="780" width="16" height="40" className={styles.bldFgChimney} />
              <WobblyRect wobble={wobble} wobbleStrength={strength} x="215" y="775" width="26" height="6" className={styles.bldFgChimney} />
              {/* Left chimney steam puffs */}
              <g fill="none" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8">
                <circle cx="228" cy="775" r="1.2" className={styles.smokePuff1} />
                <circle cx="228" cy="775" r="1.2" className={styles.smokePuff2} />
                <circle cx="228" cy="775" r="1.2" className={styles.smokePuff3} />
              </g>

              <WobblyRect wobble={wobble} wobbleStrength={strength} x="360" y="760" width="22" height="60" className={styles.bldFgChimney} />
              <WobblyRect wobble={wobble} wobbleStrength={strength} x="354" y="754" width="34" height="6" className={styles.bldFgChimney} />
              {/* Center chimney steam puffs */}
              <g fill="none" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8">
                <circle cx="371" cy="750" r="1.5" className={styles.smokePuff1} />
                <circle cx="371" cy="750" r="1.5" className={styles.smokePuff2} />
                <circle cx="371" cy="750" r="1.5" className={styles.smokePuff3} />
              </g>
              {/* Exhaust Fan Housing & backplate */}
              <ellipse cx="371" cy="750" rx="8.5" ry="3.5" fill="none" className={styles.exhaustGlowBackplate} />
              <ellipse cx="371" cy="750" rx="9" ry="4" fill="var(--skyline-fill-bg)" stroke="var(--skyline-stroke-mid)" strokeWidth="1" />

              {/* Gothic Corbel/Pedestal for Gargoyle at the corner of the right building */}
              <WobblyPath 
                wobble={wobble} 
                wobbleStrength={strength} 
                d="M 1416 760 C 1416 775, 1428 785, 1428 795 L 1438 795 C 1438 780, 1426 768, 1426 760 Z" 
                fill="var(--skyline-gargoyle-fill)" 
                stroke="var(--skyline-stroke-fg)" 
                strokeWidth="1.5" 
              />
              <WobblyRect 
                wobble={wobble} 
                wobbleStrength={strength} 
                x="1412" 
                y="756" 
                width="28" 
                height="5" 
                fill="var(--skyline-gargoyle-fill)" 
                stroke="var(--skyline-stroke-fg)" 
                strokeWidth="1.5" 
              />

              {/* RIGHT ROOFTOP SECTION */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1420 1250 L 1420 760 L 2920 760 L 2920 1250 Z" className={styles.bldFgRightRoof} />
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1420 1250 L 1420 760 L 2920 760 L 2920 1250 Z" fill="url(#brick-fg)" stroke="none" pointerEvents="none" className={styles.brickOverlay} />

              {/* Right Facade Fire Escape */}
              <g stroke="var(--skyline-stroke-fg)" strokeWidth="1.2" fill="none">
                {/* Vertical support rails */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1515" y1="760" x2="1515" y2="1080" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1550" y1="760" x2="1550" y2="1080" />
                
                {/* Platform 1 (y=800) */}
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="1510" y="800" width="45" height="5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1510" y1="790" x2="1555" y2="790" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1510" y1="790" x2="1510" y2="800" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1555" y1="790" x2="1555" y2="800" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1520" y1="790" x2="1520" y2="800" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1530" y1="790" x2="1530" y2="800" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1540" y1="790" x2="1540" y2="800" />

                {/* Platform 2 (y=880) */}
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="1510" y="880" width="45" height="5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1510" y1="870" x2="1555" y2="870" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1510" y1="870" x2="1510" y2="880" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1555" y1="870" x2="1555" y2="880" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1520" y1="870" x2="1520" y2="880" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1530" y1="870" x2="1530" y2="880" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1540" y1="870" x2="1540" y2="880" />

                {/* Platform 3 (y=960) */}
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="1510" y="960" width="45" height="5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1510" y1="950" x2="1555" y2="950" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1510" y1="950" x2="1510" y2="960" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1555" y1="950" x2="1555" y2="960" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1520" y1="950" x2="1520" y2="960" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1530" y1="950" x2="1530" y2="960" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1540" y1="950" x2="1540" y2="960" />

                {/* Diagonal stairs 1 */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1550" y1="805" x2="1515" y2="870" strokeWidth="1.6" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1550" y1="813" x2="1515" y2="878" strokeWidth="0.8" />
                {/* Diagonal stairs 2 */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1515" y1="885" x2="1550" y2="950" strokeWidth="1.6" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1515" y1="893" x2="1550" y2="958" strokeWidth="0.8" />
              </g>

              {/* Localized brick textures on right facade */}
              <g stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" fill="none" opacity="0.5">
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1620" y1="840" x2="1635" y2="840" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1625" y1="846" x2="1640" y2="846" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1618" y1="852" x2="1630" y2="852" />
              </g>
              
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1420" y1="766" x2="2920" y2="766" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" fill="none" />

              {/* Right Wall Graffiti Tag (FREAK) */}
              <g className={styles.rightWallGraffiti} fill="none">
                {/* F */}
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1426 790 L 1426 780 L 1434 780 M 1426 785 L 1432 785" />
                {/* R */}
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1426 795 L 1426 805 M 1426 795 H 1431 C 1434 795, 1434 800, 1431 800 H 1426 M 1429 800 L 1434 805" />
                {/* E */}
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1434 810 L 1426 810 L 1426 820 L 1434 820 M 1426 815 L 1432 815" />
                {/* A */}
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1426 835 L 1430 825 L 1434 835 M 1427 831 L 1433 831" />
                {/* K */}
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1426 840 L 1426 850 M 1434 840 L 1427 845 L 1434 850" />
              </g>

              {/* Utility cable on right roof */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1609 728 Q 1680 745 1750 725" fill="none" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" />

              {/* Right Parapet Brick Mortar Lines (Removed) */}

              {/* ── RIGHT FACADE WINDOWS (Arched Top Row + Rectangular Grid) ── */}
              <g fill="var(--skyline-window-dark-fill)">
                {/* Row 1: Arched windows below parapet (y=790-818) */}
                <g stroke="var(--skyline-stroke-mid)" strokeWidth="1.2">
                  {/* Arched window 1 */}
                  <g className={styles.interactiveWindowGroup}>
                    <WobblyRect wobble={wobble} wobbleStrength={strength} x="1440" y="790" width="22" height="28" />
                    <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1440 790 A 11 11 0 0 1 1462 790" />
                  </g>
                  {/* Arched window 2 */}
                  <g className={styles.interactiveWindowGroup}>
                    <WobblyRect wobble={wobble} wobbleStrength={strength} x="1480" y="790" width="22" height="28" />
                    <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1480 790 A 11 11 0 0 1 1502 790" />
                  </g>
                  {/* Arched window 3 */}
                  <g className={`${styles.interactiveWindowGroup} ${styles.glowingForegroundWindowPink}`}>
                    <WobblyRect wobble={wobble} wobbleStrength={strength} x="1520" y="790" width="22" height="28" />
                    <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1520 790 A 11 11 0 0 1 1542 790" />
                  </g>
                  {/* Arched window 4 */}
                  <g className={styles.interactiveWindowGroup}>
                    <WobblyRect wobble={wobble} wobbleStrength={strength} x="1580" y="790" width="22" height="28" />
                    <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1580 790 A 11 11 0 0 1 1602 790" />
                  </g>
                  {/* Arched window 5 */}
                  <g className={styles.interactiveWindowGroup}>
                    <WobblyRect wobble={wobble} wobbleStrength={strength} x="1620" y="790" width="22" height="28" />
                    <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1620 790 A 11 11 0 0 1 1642 790" />
                  </g>
                  {/* Arched window 6 */}
                  <g className={styles.interactiveWindowGroup}>
                    <WobblyRect wobble={wobble} wobbleStrength={strength} x="1700" y="790" width="22" height="28" />
                    <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1700 790 A 11 11 0 0 1 1722 790" />
                  </g>
                  {/* Arched window 7 */}
                  <g className={`${styles.interactiveWindowGroup} ${styles.glowingForegroundWindowCyan}`}>
                    <WobblyRect wobble={wobble} wobbleStrength={strength} x="1740" y="790" width="22" height="28" />
                    <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1740 790 A 11 11 0 0 1 1762 790" />
                  </g>
                  {/* Arched window 8 */}
                  <g className={styles.interactiveWindowGroup}>
                    <WobblyRect wobble={wobble} wobbleStrength={strength} x="1840" y="790" width="22" height="28" />
                    <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1840 790 A 11 11 0 0 1 1862 790" />
                  </g>
                  {/* Arched window 9 */}
                  <g className={styles.interactiveWindowGroup}>
                    <WobblyRect wobble={wobble} wobbleStrength={strength} x="1880" y="790" width="22" height="28" />
                    <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1880 790 A 11 11 0 0 1 1902 790" />
                  </g>
                </g>

                {/* Row 2: Rectangular windows (y=840-862) */}
                <g stroke="var(--skyline-stroke-mid)" strokeWidth="1.0">
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1440" y="840" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1472" y="840" width="18" height="22" />
                  {/* Detective Silhouette in window */}
                  <g fill="var(--skyline-fill-bg)" stroke="var(--skyline-stroke-mid)" strokeWidth="0.6">
                    <path d="M 1474 862 C 1474 853 1476 851 1481 851 C 1486 851 1488 853 1488 862 Z" />
                    <circle cx="1481" cy="848" r="3" />
                    <ellipse cx="1481" cy="845" rx="5" ry="1" />
                    <path d="M 1478.5 845 L 1479 841 L 1483 841 L 1483.5 845 Z" />
                  </g>
                  <WobblyRect className={`${styles.interactiveWindow} ${styles.glowingForegroundWindowPink}`} wobble={wobble} wobbleStrength={strength} x="1504" y="840" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1536" y="840" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1580" y="840" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1612" y="840" width="18" height="22" />
                  <WobblyRect className={`${styles.interactiveWindow} ${styles.glowingForegroundWindowCyan}`} wobble={wobble} wobbleStrength={strength} x="1700" y="840" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1732" y="840" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1840" y="840" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1872" y="840" width="18" height="22" />
                  {/* Mullions */}
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1449" y1="840" x2="1449" y2="862" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1481" y1="840" x2="1481" y2="862" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1513" y1="840" x2="1513" y2="862" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1545" y1="840" x2="1545" y2="862" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1589" y1="840" x2="1589" y2="862" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1621" y1="840" x2="1621" y2="862" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1709" y1="840" x2="1709" y2="862" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1741" y1="840" x2="1741" y2="862" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1849" y1="840" x2="1849" y2="862" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1881" y1="840" x2="1881" y2="862" strokeWidth="0.6" />
                </g>

                {/* Row 3: Rectangular windows (y=885-907) */}
                <g stroke="var(--skyline-stroke-mid)" strokeWidth="1.0">
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1440" y="885" width="18" height="22" />
                  <WobblyRect className={`${styles.interactiveWindow} ${styles.glowingForegroundWindowYellow}`} wobble={wobble} wobbleStrength={strength} x="1472" y="885" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1504" y="885" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1536" y="885" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1580" y="885" width="18" height="22" />
                  <WobblyRect className={`${styles.interactiveWindow} ${styles.glowingForegroundWindowCyan}`} wobble={wobble} wobbleStrength={strength} x="1612" y="885" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1700" y="885" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1732" y="885" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1840" y="885" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1872" y="885" width="18" height="22" />
                  {/* Mullions */}
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1449" y1="885" x2="1449" y2="907" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1481" y1="885" x2="1481" y2="907" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1513" y1="885" x2="1513" y2="907" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1545" y1="885" x2="1545" y2="907" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1589" y1="885" x2="1589" y2="907" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1621" y1="885" x2="1621" y2="907" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1709" y1="885" x2="1709" y2="907" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1741" y1="885" x2="1741" y2="907" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1849" y1="885" x2="1849" y2="907" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1881" y1="885" x2="1881" y2="907" strokeWidth="0.6" />
                </g>

                {/* Row 4: Rectangular windows (y=930-952) */}
                <g stroke="var(--skyline-stroke-mid)" strokeWidth="1.0">
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1440" y="930" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1472" y="930" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1504" y="930" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1536" y="930" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1580" y="930" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1612" y="930" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1700" y="930" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1732" y="930" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1840" y="930" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1872" y="930" width="18" height="22" />
                  {/* Mullions */}
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1449" y1="930" x2="1449" y2="952" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1481" y1="930" x2="1481" y2="952" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1513" y1="930" x2="1513" y2="952" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1545" y1="930" x2="1545" y2="952" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1589" y1="930" x2="1589" y2="952" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1621" y1="930" x2="1621" y2="952" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1709" y1="930" x2="1709" y2="952" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1741" y1="930" x2="1741" y2="952" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1849" y1="930" x2="1849" y2="952" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1881" y1="930" x2="1881" y2="952" strokeWidth="0.6" />
                </g>

                {/* Row 5: Rectangular windows (y=975-997) */}
                <g stroke="var(--skyline-stroke-mid)" strokeWidth="1.0">
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1440" y="975" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1472" y="975" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1504" y="975" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1536" y="975" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1580" y="975" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1612" y="975" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1700" y="975" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1732" y="975" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1840" y="975" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1872" y="975" width="18" height="22" />
                  {/* Mullions */}
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1449" y1="975" x2="1449" y2="997" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1481" y1="975" x2="1481" y2="997" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1513" y1="975" x2="1513" y2="997" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1545" y1="975" x2="1545" y2="997" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1589" y1="975" x2="1589" y2="997" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1621" y1="975" x2="1621" y2="997" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1709" y1="975" x2="1709" y2="997" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1741" y1="975" x2="1741" y2="997" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1849" y1="975" x2="1849" y2="997" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1881" y1="975" x2="1881" y2="997" strokeWidth="0.6" />
                </g>

                {/* Row 6: Rectangular windows (y=1020-1042) */}
                <g stroke="var(--skyline-stroke-mid)" strokeWidth="1.0">
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1440" y="1020" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1472" y="1020" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1504" y="1020" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1536" y="1020" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1580" y="1020" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1612" y="1020" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1700" y="1020" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1732" y="1020" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1840" y="1020" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1872" y="1020" width="18" height="22" />
                  {/* Mullions */}
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1449" y1="1020" x2="1449" y2="1042" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1481" y1="1020" x2="1481" y2="1042" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1513" y1="1020" x2="1513" y2="1042" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1545" y1="1020" x2="1545" y2="1042" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1589" y1="1020" x2="1589" y2="1042" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1621" y1="1020" x2="1621" y2="1042" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1709" y1="1020" x2="1709" y2="1042" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1741" y1="1020" x2="1741" y2="1042" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1849" y1="1020" x2="1849" y2="1042" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1881" y1="1020" x2="1881" y2="1042" strokeWidth="0.6" />
                </g>

                {/* Row 7: Rectangular windows (y=1065-1087) */}
                <g stroke="var(--skyline-stroke-mid)" strokeWidth="1.0">
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1440" y="1065" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1472" y="1065" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1504" y="1065" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1536" y="1065" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1580" y="1065" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1612" y="1065" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1700" y="1065" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1732" y="1065" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1840" y="1065" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1872" y="1065" width="18" height="22" />
                  {/* Mullions */}
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1449" y1="1065" x2="1449" y2="1087" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1481" y1="1065" x2="1481" y2="1087" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1513" y1="1065" x2="1513" y2="1087" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1545" y1="1065" x2="1545" y2="1087" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1589" y1="1065" x2="1589" y2="1087" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1621" y1="1065" x2="1621" y2="1087" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1709" y1="1065" x2="1709" y2="1087" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1741" y1="1065" x2="1741" y2="1087" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1849" y1="1065" x2="1849" y2="1087" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1881" y1="1065" x2="1881" y2="1087" strokeWidth="0.6" />
                </g>

                {/* Row 8: Rectangular windows (y=1110-1132) */}
                <g stroke="var(--skyline-stroke-mid)" strokeWidth="1.0">
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1440" y="1110" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1472" y="1110" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1504" y="1110" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1536" y="1110" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1580" y="1110" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1612" y="1110" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1700" y="1110" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1732" y="1110" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1840" y="1110" width="18" height="22" />
                  <WobblyRect className={styles.interactiveWindow} wobble={wobble} wobbleStrength={strength} x="1872" y="1110" width="18" height="22" />
                  {/* Mullions */}
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1449" y1="1110" x2="1449" y2="1132" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1481" y1="1110" x2="1481" y2="1132" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1513" y1="1110" x2="1513" y2="1132" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1545" y1="1110" x2="1545" y2="1132" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1589" y1="1110" x2="1589" y2="1132" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1621" y1="1110" x2="1621" y2="1132" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1709" y1="1110" x2="1709" y2="1132" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1741" y1="1110" x2="1741" y2="1132" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1849" y1="1110" x2="1849" y2="1132" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1881" y1="1110" x2="1881" y2="1132" strokeWidth="0.6" />
                </g>

                {/* Decorative horizontal stringcourse bands */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1420" y1="828" x2="1920" y2="828" stroke="var(--skyline-stroke-mid)" strokeWidth="1.0" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1420" y1="873" x2="1920" y2="873" stroke="var(--skyline-mortar-stroke)" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1420" y1="918" x2="1920" y2="918" stroke="var(--skyline-mortar-stroke)" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1420" y1="963" x2="1920" y2="963" stroke="var(--skyline-mortar-stroke)" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1420" y1="1008" x2="1920" y2="1008" stroke="var(--skyline-mortar-stroke)" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1420" y1="1053" x2="1920" y2="1053" stroke="var(--skyline-mortar-stroke)" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1420" y1="1098" x2="1920" y2="1098" stroke="var(--skyline-mortar-stroke)" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1420" y1="1143" x2="1920" y2="1143" stroke="var(--skyline-mortar-stroke)" strokeWidth="0.8" />
              </g>

              {/* ── RIGHT FACADE FIRE ESCAPE (Zigzag Staircase) ── */}
              <g stroke="var(--skyline-stroke-mid)" strokeWidth="1.2" fill="none">
                {/* Vertical structural rails (full height) */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1660" y1="770" x2="1660" y2="1250" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1690" y1="770" x2="1690" y2="1250" />

                {/* Landing platforms (horizontal) */}
                {[818, 862, 907, 952, 997, 1042, 1087, 1132, 1177, 1222].map(y => (
                  <WobblyLine key={`right-platform-${y}`} wobble={wobble} wobbleStrength={strength} x1="1658" y1={y} x2="1692" y2={y} strokeWidth="1.5" />
                ))}

                {/* Platform railing details: Top rail, Mid rail, End posts & Pickets */}
                {[818, 862, 907, 952, 997, 1042, 1087, 1132, 1177].map((y) => {
                  const yTop = y - 8;
                  const yMid = y - 4;
                  const pickets = [1663, 1668, 1673, 1678, 1683, 1688];
                  return (
                    <g key={`right-platform-details-${y}`}>
                      {/* Railing end posts */}
                      <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1658" y1={yTop} x2="1658" y2={y} strokeWidth="0.8" />
                      <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1692" y1={yTop} x2="1692" y2={y} strokeWidth="0.8" />
                      {/* Top rail */}
                      <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1658" y1={yTop} x2="1692" y2={yTop} strokeWidth="0.8" />
                      {/* Mid rail */}
                      <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1658" y1={yMid} x2="1692" y2={yMid} strokeWidth="0.6" />
                      {/* Pickets */}
                      {pickets.map(px => (
                        <WobblyLine key={`p-${px}`} wobble={wobble} wobbleStrength={strength} x1={px} y1={yTop} x2={px} y2={y} strokeWidth="0.5" />
                      ))}
                    </g>
                  );
                })}

                {/* Double-stringer Diagonal Staircases with steps, handrails, and supports */}
                {[
                  { y1: 818, y2: 862, x1: 1688, x2: 1662 },
                  { y1: 862, y2: 907, x1: 1662, x2: 1688 },
                  { y1: 907, y2: 952, x1: 1688, x2: 1662 },
                  { y1: 952, y2: 997, x1: 1662, x2: 1688 },
                  { y1: 997, y2: 1042, x1: 1688, x2: 1662 },
                  { y1: 1042, y2: 1087, x1: 1662, x2: 1688 },
                  { y1: 1087, y2: 1132, x1: 1688, x2: 1662 },
                  { y1: 1132, y2: 1177, x1: 1662, x2: 1688 },
                  { y1: 1177, y2: 1222, x1: 1688, x2: 1662 }
                ].map((stair, idx) => {
                  const { x1, y1, x2, y2 } = stair;
                  const tVals = [1/5, 2/5, 3/5, 4/5];
                  
                  const post1_t = 0.25;
                  const post1_y = y1 + post1_t * (y2 - y1);
                  const post1_x = x1 + post1_t * (x2 - x1);
                  
                  const post2_t = 0.75;
                  const post2_y = y1 + post2_t * (y2 - y1);
                  const post2_x = x1 + post2_t * (x2 - x1);

                  return (
                    <g key={`right-stair-${idx}`}>
                      <WobblyLine wobble={wobble} wobbleStrength={strength} x1={x1 - 2} y1={y1} x2={x2 - 2} y2={y2} strokeWidth="1.0" />
                      <WobblyLine wobble={wobble} wobbleStrength={strength} x1={x1 + 2} y1={y1} x2={x2 + 2} y2={y2} strokeWidth="1.0" />
                      {tVals.map((t, stepIdx) => {
                        const yStep = y1 + t * (y2 - y1);
                        const xCent = x1 + t * (x2 - x1);
                        return (
                          <WobblyLine key={`step-${stepIdx}`} wobble={wobble} wobbleStrength={strength} x1={xCent - 2} y1={yStep} x2={xCent + 2} y2={yStep} strokeWidth="0.8" />
                        );
                      })}
                      <WobblyLine wobble={wobble} wobbleStrength={strength} x1={x1} y1={y1 - 7} x2={x2} y2={y2 - 7} strokeWidth="0.8" />
                      <WobblyLine wobble={wobble} wobbleStrength={strength} x1={post1_x} y1={post1_y} x2={post1_x} y2={post1_y - 7} strokeWidth="0.6" />
                      <WobblyLine wobble={wobble} wobbleStrength={strength} x1={post2_x} y1={post2_y} x2={post2_x} y2={post2_y - 7} strokeWidth="0.6" />
                    </g>
                  );
                })}

                {/* Drop-down retractable bottom ladder */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1675" y1="1222" x2="1675" y2="1250" strokeWidth="1.0" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1672" y1="1228" x2="1678" y2="1228" strokeWidth="0.7" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1672" y1="1234" x2="1678" y2="1234" strokeWidth="0.7" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1672" y1="1240" x2="1678" y2="1240" strokeWidth="0.7" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1672" y1="1246" x2="1678" y2="1246" strokeWidth="0.7" />

                {/* Bracket supports attaching to wall */}
                {[818, 862, 907, 952, 997, 1042, 1087, 1132, 1177, 1222].map(y => (
                  <React.Fragment key={`right-support-${y}`}>
                    <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1658" y1={y} x2="1652" y2={y} strokeWidth="1.5" />
                    <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1692" y1={y} x2="1698" y2={y} strokeWidth="1.5" />
                  </React.Fragment>
                ))}
              </g>

              {/* Roof HVAC Unit */}
              <WobblyRect wobble={wobble} wobbleStrength={strength} x="1750" y="715" width="65" height="45" className={styles.bldFgHvac} />
              {/* HVAC Grid */}
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1760" y1="725" x2="1805" y2="725" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1760" y1="735" x2="1805" y2="735" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1760" y1="745" x2="1805" y2="745" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" />

              {/* Industrial Blower Unit (Static parts) */}
              <g className={styles.bldFgBlower} stroke="var(--skyline-stroke-fg)" strokeWidth="1.2">
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="1587" y="725" width="22" height="35" rx="1" />
                {/* Fan casing circle & backplate */}
                <circle cx="1598" cy="742" r="7.5" fill="none" className={styles.fanGlowBackplate} />
                <circle cx="1598" cy="742" r="8" />

                {/* Exhaust Pipe Stack */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1598" y1="725" x2="1598" y2="717" stroke="var(--skyline-stroke-fg)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1595" y1="717" x2="1601" y2="717" stroke="var(--skyline-stroke-fg)" strokeWidth="1.5" />
              </g>

              {/* Rooftop Clothesline (Static posts & wire) */}
              <g stroke="var(--skyline-stroke-mid)" strokeWidth="1" fill="none">
                {/* Left & Right Posts */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1640" y1="760" x2="1640" y2="710" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1705" y1="760" x2="1705" y2="710" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1635" y1="710" x2="1645" y2="710" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1700" y1="710" x2="1710" y2="710" />
                {/* Sagging Line */}
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1640 715 Q 1672 725 1705 715" strokeWidth="0.8" />
              </g>

              {/* Roof Chimney Duct for Steam */}
              <WobblyRect wobble={wobble} wobbleStrength={strength} x="1860" y="700" width="18" height="60" className={styles.bldFgChimney} />
              <WobblyRect wobble={wobble} wobbleStrength={strength} x="1854" y="694" width="30" height="6" className={styles.bldFgChimney} />
              {/* Right building chimney steam puffs */}
              <g fill="none" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8">
                <circle cx="1869" cy="694" r="1.2" className={styles.smokePuff1} />
                <circle cx="1869" cy="694" r="1.2" className={styles.smokePuff2} />
                <circle cx="1869" cy="694" r="1.2" className={styles.smokePuff3} />
              </g>

              {/* Right Rooftop Water Tank */}
              <g>
                {/* Trestle Support Legs */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1445" y1="760" x2="1448" y2="725" strokeWidth="1.4" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1485" y1="760" x2="1482" y2="725" strokeWidth="1.4" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1457" y1="760" x2="1459" y2="725" strokeWidth="0.8" opacity="0.6" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1473" y1="760" x2="1471" y2="725" strokeWidth="0.8" opacity="0.6" />
                
                {/* Cross Bracing */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1448" y1="725" x2="1483" y2="742" strokeWidth="0.8" opacity="0.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1482" y1="725" x2="1447" y2="742" strokeWidth="0.8" opacity="0.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1447" y1="742" x2="1485" y2="760" strokeWidth="0.8" opacity="0.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1483" y1="742" x2="1445" y2="760" strokeWidth="0.8" opacity="0.5" />
                
                {/* Horizontal Struts */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1447" y1="742" x2="1483" y2="742" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1446" y1="725" x2="1484" y2="725" strokeWidth="1.8" />
                
                {/* Center Pipe */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1465" y1="725" x2="1465" y2="760" strokeWidth="2.5" />
                
                {/* Tank Barrel Body */}
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="1445" y="670" width="40" height="55" className={styles.bldFgRightWaterTankBody} />
                
                {/* Vertical Staves (Planks) */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1450" y1="670" x2="1450" y2="725" strokeWidth="0.6" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1455" y1="670" x2="1455" y2="725" strokeWidth="0.6" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1460" y1="670" x2="1460" y2="725" strokeWidth="0.6" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1465" y1="670" x2="1465" y2="725" strokeWidth="0.6" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1470" y1="670" x2="1470" y2="725" strokeWidth="0.6" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1475" y1="670" x2="1475" y2="725" strokeWidth="0.6" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1480" y1="670" x2="1480" y2="725" strokeWidth="0.6" stroke="var(--skyline-stroke-fine)" />
                
                {/* Horizontal Steel Hoops */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1445" y1="676" x2="1485" y2="676" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1445" y1="686" x2="1485" y2="686" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1445" y1="697" x2="1485" y2="697" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1445" y1="707" x2="1485" y2="707" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1445" y1="716" x2="1485" y2="716" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1445" y1="721" x2="1485" y2="721" strokeWidth="0.8" />
                
                {/* Conical Roof */}
                <WobblyPolygon wobble={wobble} wobbleStrength={strength} points="1442,670 1465,642 1488,670" className={styles.bldFgRightWaterTankRoof} />
                {/* warning beacon at right tank roof peak */}
                <circle cx="1465" cy="642" r="2.2" className={styles.waterTankBeacon} />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1465" y1="642" x2="1442" y2="670" strokeWidth="0.8" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1465" y1="642" x2="1449" y2="670" strokeWidth="0.8" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1465" y1="642" x2="1457" y2="670" strokeWidth="0.8" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1465" y1="642" x2="1465" y2="670" strokeWidth="0.8" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1465" y1="642" x2="1473" y2="670" strokeWidth="0.8" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1465" y1="642" x2="1481" y2="670" strokeWidth="0.8" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1465" y1="642" x2="1488" y2="670" strokeWidth="0.8" stroke="var(--skyline-stroke-fine)" />
                
                {/* Finial Peak */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1465" y1="642" x2="1465" y2="632" strokeWidth="1.2" />
                <circle cx="1465" cy="632" r="1.5" fill="var(--skyline-stroke-fg)" stroke="none" />
                
                {/* Side Ladder */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1490" y1="728" x2="1490" y2="666" strokeWidth="0.8" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1493.5" y1="728" x2="1493.5" y2="666" strokeWidth="0.8" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1490" y1="670" x2="1493.5" y2="670" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1490" y1="675" x2="1493.5" y2="675" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1490" y1="680" x2="1493.5" y2="680" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1490" y1="685" x2="1493.5" y2="685" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1490" y1="690" x2="1493.5" y2="690" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1490" y1="695" x2="1493.5" y2="695" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1490" y1="700" x2="1493.5" y2="700" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1490" y1="705" x2="1493.5" y2="705" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1490" y1="710" x2="1493.5" y2="710" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1490" y1="715" x2="1493.5" y2="715" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1490" y1="720" x2="1493.5" y2="720" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1490" y1="725" x2="1493.5" y2="725" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
              </g>

              {/* Shadow overlay paths for wobbly hatching depth (Static) */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 205 1250 L 205 820 L 460 820 L 460 1250 Z" className={styles.shadowHatchFg} />
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1695 1250 L 1695 760 L 2920 760 L 2920 1250 Z" className={styles.shadowHatchFg} />
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 322 750 L 355 750 L 355 820 L 322 820 Z" className={styles.shadowHatchFg} />
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1782 715 L 1815 715 L 1815 760 L 1782 760 Z" className={styles.shadowHatchFg} />

              {/* Left water tank shadow hatches */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 396 748 L 412 748 L 412 792 L 396 792 Z" className={styles.shadowHatchFg} />
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 396 726 L 414 748 L 396 748 Z" className={styles.shadowHatchFg} />
              
              {/* Right water tank shadow hatches */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1465 670 L 1485 670 L 1485 725 L 1465 725 Z" className={styles.shadowHatchFg} />
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1465 642 L 1488 670 L 1465 670 Z" className={styles.shadowHatchFg} />
            </g>
      </svg>

      {/* Animated Layer (Unfiltered) */}
      <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMax slice" style={{ width: '100%', height: '100%', overflow: 'visible', position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <defs>
              {/* Fog Mist Vertical Linear Gradient */}
              <linearGradient id="fogGradient" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="rgba(250, 250, 250, 0.15)" />
                <stop offset="50%" stopColor="rgba(250, 250, 250, 0.06)" />
                <stop offset="100%" stopColor="rgba(250, 250, 250, 0)" />
              </linearGradient>

              {/* Billboard Spotlight Gradient */}
              <linearGradient id="leftLightGrad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="rgba(250, 250, 250, 0.15)" />
                <stop offset="60%" stopColor="rgba(250, 250, 250, 0.04)" />
                <stop offset="100%" stopColor="rgba(250, 250, 250, 0)" />
              </linearGradient>

              {/* Billboard Spotlight Gradient Popart */}
              <linearGradient id="leftLightGradPopart" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="rgba(255, 64, 129, 0.25)" />
                <stop offset="60%" stopColor="rgba(255, 64, 129, 0.06)" />
                <stop offset="100%" stopColor="rgba(255, 64, 129, 0)" />
              </linearGradient>
            </defs>

            {/* Group B: Unfiltered Foreground Animating Elements (Separated to bypass displacement map redraw cost for GPU performance) */}
            <g fill="var(--skyline-fill-bg)" stroke="var(--skyline-stroke-fg)" strokeWidth="1.8" className={styles.buildingGroup}>
              {/* Puddle Ripples */}
              <ellipse cx="150" cy="820" rx="28" ry="2.5" className={styles.puddleRipple1} fill="none" stroke="var(--skyline-puddle-stroke)" strokeWidth="0.6" />
              <ellipse cx="150" cy="820" rx="28" ry="2.5" className={styles.puddleRipple2} fill="none" stroke="var(--skyline-puddle-stroke)" strokeWidth="0.6" />

              {/* Water Tank Warning Beacon */}
              <g stroke="none">
                <circle cx="396" cy="726" r="2.2" className={styles.waterTankBeacon} />
              </g>

              {/* Cocktail Glass Logo & Neon Text */}
              <g className={styles.billboardNeon}>
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 104 718 L 124 718 L 114 734 Z" fill="none" stroke="#ff1493" strokeWidth="1.2" /> {/* Glass Bowl */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="114" y1="734" x2="114" y2="746" stroke="#ff1493" strokeWidth="1.5" /> {/* Stem */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="107" y1="746" x2="121" y2="746" stroke="#ff1493" strokeWidth="1.5" /> {/* Base */}
                
                <text x="154" y="728" textAnchor="middle" fontFamily="var(--font-code)" fontWeight="bold" fontSize="7.8" fill="#ff1493" stroke="none">NOIR</text>
                <text x="154" y="740" textAnchor="middle" fontFamily="var(--font-code)" fontWeight="bold" fontSize="7.8" fill="#ff1493" stroke="none">GIN</text>
              </g>

              {/* Neon EXIT Sign above the door */}
              <g className={styles.exitNeonSign}>
                <rect x="306" y="756" width="20" height="9" rx="1" fill="#000" stroke="#39ff14" strokeWidth="0.8" />
                <text x="316" y="763" textAnchor="middle" fontFamily="var(--font-code)" fontWeight="bold" fontSize="4.8" fill="#39ff14" stroke="none">EXIT</text>
              </g>
              {/* Animated Billboard Spotlight */}
              <polygon points="130,820 80,695 180,695" fill="var(--skyline-left-light-grad)" stroke="none" className={styles.billboardLight} />

              {/* Falling water droplet from copper pipe */}
              <circle cx="150" cy="805" r="1.5" className={styles.drippingDrop} stroke="none" />

              {/* Cat Silhouette sitting on penthouse roof */}
              <RunningCat reducedMotion={reducedMotion} />

              {/* Interactive wobbly Gargoyle sitting on right building roof peak */}
              <InteractiveGargoyle reducedMotion={reducedMotion} />

              {/* Pigeons */}
              <BillboardPigeon reducedMotion={reducedMotion} />
              <FirePigeon reducedMotion={reducedMotion} />

              {/* Spinning Fan Blades (Animating) */}
              <g className={styles.fanBlade}>
                <line x1="371" y1="750" x2="366" y2="748" stroke="var(--skyline-stroke-fg)" strokeWidth="1" />
                <line x1="371" y1="750" x2="376" y2="752" stroke="var(--skyline-stroke-fg)" strokeWidth="1" />
                <line x1="371" y1="750" x2="369" y2="753" stroke="var(--skyline-stroke-fg)" strokeWidth="1" />
                <line x1="371" y1="750" x2="373" y2="747" stroke="var(--skyline-stroke-fg)" strokeWidth="1" />
              </g>

              {/* Blower wheel spokes (Animating) */}
              <circle cx="1598" cy="742" r="1.5" fill="var(--skyline-stroke-fg)" stroke="none" />
              <g className={styles.blowerFan}>
                <line x1="1598" y1="742" x2="1598" y2="734" stroke="var(--skyline-stroke-fg)" strokeWidth="0.8" />
                <line x1="1598" y1="742" x2="1598" y2="750" stroke="var(--skyline-stroke-fg)" strokeWidth="0.8" />
                <line x1="1598" y1="742" x2="1590" y2="742" stroke="var(--skyline-stroke-fg)" strokeWidth="0.8" />
                <line x1="1598" y1="742" x2="1606" y2="742" stroke="var(--skyline-stroke-fg)" strokeWidth="0.8" />
                <line x1="1598" y1="742" x2="1592" y2="736" stroke="var(--skyline-stroke-mid)" strokeWidth="0.6" />
                <line x1="1598" y1="742" x2="1604" y2="748" stroke="var(--skyline-stroke-mid)" strokeWidth="0.6" />
                <line x1="1598" y1="742" x2="1592" y2="748" stroke="var(--skyline-stroke-mid)" strokeWidth="0.6" />
                <line x1="1598" y1="742" x2="1604" y2="736" stroke="var(--skyline-stroke-mid)" strokeWidth="0.6" />
              </g>

              {/* Swaying Laundry (Animating) */}
              <g>
                {/* Trench Coat (Sway 1) */}
                <g className={styles.laundry1}>
                  <path d="M 1648 718 L 1645 724 L 1642 728 L 1644 738 L 1648 735 L 1648 756 L 1662 756 L 1662 735 L 1666 738 L 1668 728 L 1665 724 L 1662 718 Z" fill="var(--skyline-laundry-coat)" stroke="var(--skyline-stroke-fg)" strokeWidth="1" />
                  <line x1="1655" y1="718" x2="1655" y2="756" stroke="var(--skyline-stroke-mid)" strokeWidth="0.6" />
                  <line x1="1648" y1="735" x2="1662" y2="735" stroke="var(--skyline-stroke-mid)" strokeWidth="0.6" />
                </g>
                {/* Trousers and Socks (Sway 2) */}
                <g className={styles.laundry2}>
                  {/* Socks */}
                  <path d="M 1664 722 L 1664 732 L 1667 734 L 1668 732 L 1666 730 L 1666 722 Z" fill="var(--skyline-laundry-trousers)" stroke="var(--skyline-stroke-fg)" strokeWidth="0.8" />
                  <path d="M 1668 722 L 1668 732 L 1671 734 L 1672 732 L 1670 730 L 1670 722 Z" fill="var(--skyline-laundry-coat)" stroke="var(--skyline-stroke-fg)" strokeWidth="0.8" />
                  {/* Trousers */}
                  <path d="M 1670 720 L 1667 750 L 1673 750 L 1676 730 L 1679 750 L 1685 750 L 1682 720 Z" fill="var(--skyline-laundry-trousers)" stroke="var(--skyline-stroke-fg)" strokeWidth="1" />
                </g>
                {/* Fedora Hat (Sway 3) */}
                <g className={styles.laundry3}>
                  <path d="M 1687 728 C 1687 724, 1690 717, 1695 717 C 1700 717, 1703 724, 1703 728 C 1706 728, 1708 729, 1708 731 C 1708 733, 1682 733, 1682 731 C 1682 729, 1684 728, 1687 728 Z" fill="var(--skyline-laundry-fedora)" stroke="var(--skyline-stroke-fg)" strokeWidth="1" />
                  <path d="M 1688 728 Q 1695 727 1702 728 L 1702 726 Q 1695 725 1688 726 Z" fill="var(--skyline-laundry-fedora-band)" stroke="none" />
                </g>
              </g>

            </g>

            {/* Group C: Rising Steam/Smoke Paths (CSS Animated) */}
            <g fill="none" stroke="var(--skyline-stroke-mid)" strokeWidth="1">
              {/* Steam from Chimney 1 */}
              <path d="M 228 770 C 222 745, 234 720, 226 695 C 220 675, 228 655, 222 635" className={styles.steam} />
              
              {/* Steam from Chimney 2 */}
              <path d="M 371 750 C 378 725, 366 700, 374 675 C 380 655, 372 635, 378 615" className={styles.steamDelayed} />

              {/* Steam from Chimney 3 */}
              <path d="M 1869 690 C 1861 665, 1873 640, 1865 615 C 1859 595, 1867 575, 1861 555" className={styles.steam} />

              {/* Steam from Industrial Blower */}
              <path d="M 1598 710 C 1606 685, 1594 660, 1602 635 C 1608 615, 1600 595, 1606 575" className={styles.steamDelayed} />
            </g>

            {/* Rolling River Fog/Mist Layers */}
            <g fill="url(#fogGradient)" stroke="none">
              {/* Fog Layer 1 */}
              <path 
                d="M -1000 920 C 100 890, 400 890, 800 915 C 1200 895, 1600 895, 2920 920 L 2920 1250 L -1000 1250 Z" 
                opacity="0.3" 
                className={styles.fog1} 
              />
              {/* Fog Layer 2 */}
              <path 
                d="M -1000 935 C 200 915, 700 905, 1100 930 C 1500 910, 1800 920, 2920 935 L 2920 1250 L -1000 1250 Z" 
                opacity="0.2" 
                className={styles.fog2} 
              />
            </g>
      </svg>
    </>
  );
});

Layer3.displayName = 'Layer3';

export default Layer3;
