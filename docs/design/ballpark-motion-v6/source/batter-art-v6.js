/* Source landmarks measured from accepted rear/three-quarter batter drawings.
   Artwork is 1024 x 1536 RGBA; all coordinates below are normalized x .5
   into 512 x 768. Anatomical right is the unguarded rear/pivot leg, left is
   the guarded lead leg. Shoe anchors are observed opaque forefoot cleats,
   not image-box corners. Contact flags/timing belong to the motion module.
   Body landmarks are manual estimates, approximately +/- 6 native pixels. */
(function(global){
  'use strict';
  const art=global.BallparkInbetweenArt=global.BallparkInbetweenArt||{};
  const entry=(file,keyTime,pins,shoeContacts,occludedPins=[])=>{
    if(occludedPins.length)Object.defineProperty(pins,'occludedPins',{value:occludedPins,enumerable:false});
    return{file,keyTime,sourcePixels:[1024,1536],normalizedPixels:[512,768],
      camera:'catcher-side rear three-quarter; mound toward upper-right',
      pins,shoeContacts,occludedPins};
  };
  const shoes=(rear,front,rearSole,frontSole)=>({
    rear:{role:'anatomical right, unguarded pivot foot',anchor:rear,sole:rearSole,
      heel:rearSole[0],toe:rearSole[rearSole.length-1],contactHull:rearSole},
    front:{role:'anatomical left, guarded lead foot',anchor:front,sole:frontSole,
      heel:frontSole[0],toe:frontSole[frontSole.length-1],contactHull:frontSole}
  });
  art.batter={...(art.batter||{}),
    ready:entry('batter-ready-v6.png',0,{
      crown:[265,84.5],head:[268,133],neck:[247,175],
      shoulderRear:[287,210],shoulderFront:[266.5,194.5],
      elbowRear:[342,278],elbowFront:[337.5,223.5],grip:[397.5,204],
      pelvis:[195,332.5],hipRear:[180,370],hipFront:[250,365],
      kneeRear:[245,507.5],kneeFront:[312.5,432.5],
      ankleRear:[160,655],ankleFront:[325,527.5],
      rearFoot:[198,728.5],frontFoot:[345,558],
      batKnob:[433.5,239],batTip:[257,14],barrel:[270,32.5]
    },{
      rear:{role:'anatomical right, unguarded pivot foot',anchor:[198,728.5],
        sole:[[110,718.5],[120,720],[130,730],[140,731.5],[160,727.5],[180,722],[190,725],[200,733.5],[210,729.5],[220,736],[230,736],[250,729.5],[260,719.5]],
        heel:[120,720],toe:[260,719.5],contactHull:[[130,730],[140,731.5],[200,733.5],[220,736],[230,736],[250,729.5]]},
      front:{role:'anatomical left, guarded lead foot',anchor:[345,558],
        sole:[[305,571.5],[315,569],[325,575],[335,569.5],[345,558.5],[355,559],[365,557],[375,559],[385,550.5]],
        heel:[305,571.5],toe:[385,550.5],contactHull:[[305,571.5],[325,575],[335,569.5],[355,559],[375,559],[385,550.5]]}
    },['shoulderFront']),
    load:entry('batter-load-v6.png',860,{
      crown:[269,73.5],head:[274,123.5],neck:[253,163],
      shoulderRear:[295.5,194.5],shoulderFront:[270,182.5],
      elbowRear:[348,262],elbowFront:[339,208],grip:[397,194.5],
      pelvis:[203.5,315],hipRear:[187.5,366.5],hipFront:[255,342.5],
      kneeRear:[252.5,490],kneeFront:[330,360],
      ankleRear:[164.5,654],ankleFront:[356,462],
      rearFoot:[215,728.5],frontFoot:[380,498],
      batKnob:[426,227.5],batTip:[292.5,12],barrel:[304,29.5]
    },shoes([215,728.5],[380,498],
      [[115,715.5],[140,726.5],[227.5,735],[252.5,719]],
      [[330,510],[342.5,512],[392.5,497.5],[405,497]]),['shoulderFront']),
    plant:entry('batter-plant-v6.png',1150,{
      crown:[264,85],head:[269,135.5],neck:[255,177],
      shoulderRear:[296,210],shoulderFront:[274,194.5],
      elbowRear:[355.5,275.5],elbowFront:[340,225],grip:[401.5,207],
      pelvis:[212,325.5],hipRear:[196,376],hipFront:[263,372],
      kneeRear:[265.5,504.5],kneeFront:[325,438],
      ankleRear:[162.5,657],ankleFront:[342,526],
      rearFoot:[210,729],frontFoot:[370,561],
      batKnob:[434.5,240],batTip:[257.5,12],barrel:[271.5,31]
    },shoes([210,729],[370,561],
      [[110,716],[135,729],[222.5,738],[260,722.5]],
      [[320,571.5],[332.5,575.5],[370,561.5],[395,557]]),['shoulderFront']),
    entry:entry('batter-entry-v6.png',1210,{
      crown:[309,101],head:[309.5,147],neck:[295,186.5],
      shoulderRear:[314.5,237.5],shoulderFront:[260,204],
      elbowRear:[356,308],elbowFront:[336.5,239],grip:[377,241.5],
      pelvis:[227,325.5],hipRear:[208.5,372],hipFront:[274.5,381.5],
      kneeRear:[276.5,508],kneeFront:[331.5,454.5],
      ankleRear:[179.5,645],ankleFront:[365.5,529.5],
      rearFoot:[235,743.5],frontFoot:[407.5,571.5],
      batKnob:[408.5,270.5],batTip:[164.5,25],barrel:[180,37]
    },shoes([235,743.5],[407.5,571.5],
      [[122.5,689.5],[147.5,708],[210,745.5],[247.5,740.5]],
      [[345,581.5],[357.5,585.5],[407.5,572],[432.5,557.5]]),['shoulderFront']),
    contact:entry('batter-contact-v6.png',1340,{
      crown:[200,31],head:[199.5,77],neck:[192.5,126],
      shoulderRear:[216.5,170],shoulderFront:[171,143],
      elbowRear:[255.5,274],elbowFront:[273,257.5],grip:[297,301],
      pelvis:[164,294.5],hipRear:[151.5,353.5],hipFront:[215,354],
      kneeRear:[201,490.5],kneeFront:[274,463.5],
      ankleRear:[107,631],ankleFront:[319,550],
      rearFoot:[142.5,748],frontFoot:[342.5,602],
      batKnob:[271.5,304.5],batTip:[494,343.5],barrel:[467.5,335]
    },shoes([142.5,748],[342.5,602],
      [[42.5,657.5],[67.5,717],[117.5,750.5],[155,736]],
      [[280,608.5],[305,611.5],[342.5,602.5],[367.5,598]]),['shoulderFront','hipFront']),
    finish:entry('batter-finish-v6.png',1565,{
      crown:[340,12.5],head:[341,60],neck:[329.5,114.5],
      shoulderRear:[241.5,147],shoulderFront:[378,141],
      elbowRear:[163.5,181],elbowFront:[248,127],grip:[198.5,109],
      pelvis:[291.5,294.5],hipRear:[264,365],hipFront:[330.5,357],
      kneeRear:[297,519],kneeFront:[352.5,500],
      ankleRear:[200,654],ankleFront:[383,581.5],
      rearFoot:[225,744],frontFoot:[412.5,626.5],
      batKnob:[293,114.5],batTip:[29,58],barrel:[48.5,60.5]
    },shoes([225,744],[412.5,626.5],
      [[140,691.5],[165,721.5],[202.5,749],[227.5,745.5]],
      [[350,634],[375,637.5],[412.5,627],[437.5,615.5]]),['shoulderFront','batKnob']),
    drive:entry('batter-drive-v6.png',1270,{
      crown:[334,72],head:[337,120],neck:[315,166],
      shoulderRear:[325.5,215],shoulderFront:[236,159],
      elbowRear:[373,302.5],elbowFront:[330,301],grip:[383,328],
      pelvis:[240,303],hipRear:[216.5,364],hipFront:[285.5,379.5],
      kneeRear:[272,492.5],kneeFront:[343.5,456],
      ankleRear:[165,622.5],ankleFront:[393,526.5],
      rearFoot:[205,747],frontFoot:[420,578],
      batKnob:[400,344.5],batTip:[133.5,25],barrel:[143,40]
    },shoes([205,747],[420,578],
      [[100,658],[130,720],[175,746.5],[220,740]],
      [[345,574],[375,591],[420,578.5],[450,564.5]]),['shoulderFront']),
    extend:entry('batter-extend-v6.png',1480,{
      crown:[202.5,46.5],head:[200,91.5],neck:[191,134],
      shoulderRear:[221.5,176],shoulderFront:[216.5,138],
      elbowRear:[304,187.5],elbowFront:[291.5,148.5],grip:[355.5,155],
      pelvis:[199.5,288],hipRear:[170,349.5],hipFront:[240,354],
      kneeRear:[217.5,490.5],kneeFront:[288,454.5],
      ankleRear:[113.5,619.5],ankleFront:[339.5,542],
      rearFoot:[157.5,745.5],frontFoot:[380,585],
      batKnob:[340.5,171.5],batTip:[493,30.5],barrel:[481.5,40.5]
    },shoes([157.5,745.5],[380,585],
      [[52.5,651],[82.5,728.5],[127.5,747.5],[157.5,746]],
      [[305,593],[335,600.5],[380,585.5],[395,580]]),['shoulderFront','batKnob']),
    unwind:entry('batter-unwind-v6.png',1940,{
      crown:[322.5,45],head:[321.5,92.5],neck:[317.5,149],
      shoulderRear:[247.5,190.5],shoulderFront:[379.5,175.5],
      elbowRear:[182.5,252],elbowFront:[238.5,163],grip:[209,174],
      pelvis:[298.5,317],hipRear:[273,375.5],hipFront:[339.5,375.5],
      kneeRear:[290.5,525],kneeFront:[363,505.5],
      ankleRear:[209,662.5],ankleFront:[390,577.5],
      rearFoot:[238.5,745.5],frontFoot:[413,619],
      batKnob:[239.5,170.5],batTip:[75,33],barrel:[88,44.5]
    },shoes([238.5,745.5],[413,619],
      [[140,685],[177.5,730],[215,750.5],[252.5,732.5]],
      [[355,628],[367.5,632],[417.5,622],[442.5,613]]),['shoulderFront','hipFront','batKnob']),
    regrip:entry('batter-regrip-v6.png',2070,{
      crown:[280.5,82],head:[280.5,129],neck:[266.5,173.5],
      shoulderRear:[292,227.5],shoulderFront:[211.5,191],
      elbowRear:[338.5,303.5],elbowFront:[325,228.5],grip:[350,238.5],
      pelvis:[233,325],hipRear:[207,388],hipFront:[274,389],
      kneeRear:[278,508.5],kneeFront:[326,473],
      ankleRear:[174,652.5],ankleFront:[351.5,555],
      rearFoot:[242.5,739.5],frontFoot:[370,597],
      batKnob:[374,263.5],batTip:[194.5,13.5],barrel:[205,26.5]
    },shoes([242.5,739.5],[370,597],
      [[122.5,718.5],[152.5,727],[242.5,740],[272.5,726.5]],
      [[325,602],[340,602],[370,597.5],[385,591.5]]),['shoulderFront']),
    bunt:entry('batter-bunt-v6.png',1340,{
      crown:[230,48],head:[229,95],neck:[211.5,139.5],
      shoulderRear:[236,183],shoulderFront:[132.5,150],
      elbowRear:[274.5,276.5],elbowFront:[282.5,239.5],grip:[319.5,257],
      pelvis:[134.5,286],hipRear:[115.5,348.5],hipFront:[191,358.5],
      kneeRear:[198.5,482.5],kneeFront:[258,405],
      ankleRear:[111,627.5],ankleFront:[295,507],
      rearFoot:[177.5,725],frontFoot:[325,537.5],
      batKnob:[301,253.5],batTip:[498,268],barrel:[482,266.5]
    },shoes([177.5,725],[325,537.5],
      [[57.5,701.5],[87.5,713.5],[177.5,725.5],[207.5,717.5]],
      [[265,543.5],[280,552.5],[325,538],[355,531.5]]),['shoulderFront','batKnob'])
  };
  // In these back-facing follow-through drawings the right/rear arm crosses
  // the chest, hidden behind the jersey, from the camera-right shoulder to
  // the hands on camera-left. The visible left sleeve/elbow is the front
  // arm. Correct complete anatomical chains; every observed pixel stays put.
  for(const key of ['finish','unwind']){
    const entry=art.batter[key],p=entry.pins;
    for(const[a,b]of [['shoulderRear','shoulderFront'],['elbowRear','elbowFront']])
      [p[a],p[b]]=[p[b],p[a]];
    for(let i=0;i<entry.occludedPins.length;i++)
      if(entry.occludedPins[i]==='shoulderFront')entry.occludedPins[i]='shoulderRear';
    entry.armRoleCorrection='Right/rear shoulder is camera-right; crossed rear arm is occluded by the back-facing jersey.';
  }
  // Read-only source inspection points, never extra rig or texture anchors.
  const backs={ready:[223,240],load:[235,235],plant:[237,242],entry:[257,250],
    drive:[277,237],contact:[154,218],extend:[159,225],finish:[303,206],
    unwind:[306,244],regrip:[248,250],bunt:[157,230]};
  for(const[key,p]of Object.entries(backs))art.batter[key].surfaceChecks={
    headBack:[art.batter[key].pins.head[0]+14,art.batter[key].pins.head[1]-13],jerseyBack:p};
  // Manual texture ownership, not additional joints. The jersey polygons
  // describe visible back fabric inside the sleeve seams, never forearms,
  // helmet or bat. Shoe polygons include the collar/ankle junction and actual
  // shoe silhouette; they do not recruit the calf or trouser leg. Keep this
  // metadata nonenumerable so rig compilation still sees exactly 20 joints.
  const regions={
    ready:{jersey:[[183,190],[246.5,195],[266.5,257.5],[240,313],[146.5,306.5],[161,215]],
      rearShoe:[[110,718.5],[119,678],[160,650],[263,700],[263,732],[230,736],[220,736],[112,733]],
      frontShoe:[[301,570],[325,522],[349,523],[385,537],[389,552],[375,559],[325,576],[305,571.5]]},
    load:{jersey:[[192,180],[252,184.5],[276,243],[252,308.5],[151,295],[180,210]],
      rearShoe:[[110,706],[164.5,651],[256,697],[260,723],[227.5,735],[132,734],[115,715.5]],
      frontShoe:[[327,499],[351,459],[375,463],[413,481],[415,499],[343,516],[330,510]]},
    plant:{jersey:[[187.5,179],[257,196.5],[278,263.5],[263,318.5],[159.5,305],[170,215]],
      rearShoe:[[107,710],[163,651],[259,699],[263,731],[222.5,738],[132,737],[110,716]],
      frontShoe:[[316,566],[342,522],[365,523],[401,537],[403,553],[395,557],[335,576],[332.5,575.5],[320,571.5]]},
    entry:{jersey:[[204.5,178.5],[279.5,207],[307,263.5],[284.5,328],[180.5,306.5],[191,212.5]],
      rearShoe:[[120,681],[173,641],[197,654],[241,697],[258,724],[249,744],[207,749],[148,710],[122.5,689.5]],
      frontShoe:[[338,574],[365,526],[389,525],[437,540],[441,556],[407.5,572],[357,587],[345,581.5]]},
    drive:{jersey:[[225.5,150.5],[292.5,181.5],[323.5,257],[303.5,311.5],[194,284],[219,207]],
      rearShoe:[[96,650],[157,616],[184,633],[208,681],[225,717],[225,746],[173,750],[130,720],[111,701]],
      frontShoe:[[342,577],[384,522],[407,526],[450,540],[459,560],[450,564.5],[420,578.5],[376,592]]},
    contact:{jersey:[[104,128],[174,155],[200.5,187.5],[202,265],[101.5,276],[83,172]],
      rearShoe:[[38,650],[102,622],[126,633],[156,720],[156,746],[119,751],[117.5,750.5],[59,720]],
      frontShoe:[[277,605],[309,548],[333,551],[374,568],[380,592],[367.5,598],[306,614],[280,608.5]]},
    extend:{jersey:[[118,139],[184.5,161],[224,185],[231.5,268],[127.5,277],[89.5,187]],
      rearShoe:[[49,647],[106,610],[129,628],[166,722],[165,747],[123,751],[82.5,728.5],[71,711]],
      frontShoe:[[303,592],[329,537],[354,541],[394,557],[403,577],[335,604],[305,593]]},
    finish:{jersey:[[239.5,135.5],[330.5,131.5],[377.5,166.5],[354,289],[252,260],[229.5,197.5]],
      rearShoe:[[135,674],[192,646],[213,654],[235,710],[238,735],[228,751],[197,751],[150,708],[140,691.5]],
      frontShoe:[[348,632],[373,577],[397,580],[438,599],[445,617],[375,640],[350,634]]},
    unwind:{jersey:[[247.5,172.5],[329,170.5],[380.5,207],[364.5,308.5],[247,288.5],[234,227]],
      rearShoe:[[135,679],[200,655],[223,665],[250,716],[252.5,732.5],[253,743],[238,752],[206,752],[177.5,730],[154,710],[140,685]],
      frontShoe:[[352,628],[380,574],[402,579],[442,596],[449,616],[387,635],[367.5,632]]},
    regrip:{jersey:[[189.5,182.5],[267.5,197.5],[289,255.5],[274,321],[179.5,307],[175,228.5]],
      rearShoe:[[120,720],[127,685],[166,647],[241,687],[277,711],[279,731],[242.5,740],[151,743]],
      frontShoe:[[313,597],[342,550],[366,553],[395,568],[401,587],[340,608],[325,602]]},
    bunt:{jersey:[[118.5,148.5],[205.5,170.5],[218.5,220.5],[187,268],[85,271.5],[92,194]],
      rearShoe:[[54,694],[104,620],[215,688],[220,715],[178,728],[78,716],[57.5,701.5]],
      frontShoe:[[263,544],[286,503],[308,508],[352,523],[364,540],[281,556]]}
  };
  for(const[key,r]of Object.entries(regions))Object.defineProperty(art.batter[key].pins,'surfaceRegions',{
    enumerable:false,value:{jersey:{polygon:r.jersey,bone:['pelvis','neck']},
      rearShoe:{polygon:r.rearShoe,bone:['ankleRear','rearFoot']},
      frontShoe:{polygon:r.frontShoe,bone:['ankleFront','frontFoot']}}});
  // Only painted wood belongs to the rigid bat frame. Split polygons at
  // helmet, jersey and glove occlusions rather than owning those intervening
  // pixels. No outside feather: adjacent skin/fabric must retain its own rig.
  const bats={
    ready:{batUpper:[[251.5,17],[267,4],[278,7],[323.5,73],[389.5,174.5],[384.5,179],[250.5,23]],
      batKnobWood:[[423,239],[435.5,230.5],[439.5,233],[439,237.5],[429,245.5],[423,243]]},
    load:{batUpper:[[281,15],[290.5,6],[302.5,4.5],[334,59],[388,164.5],[383,168],[280,22.5]],
      batKnobWood:[[419,225.5],[434,221.5],[436,224],[435,229.5],[422.5,236],[418.5,232.5]]},
    plant:{batUpper:[[252.5,15.5],[264,5.5],[272.5,4],[281,10.5],[391.5,176],[387,181],[251,25]],
      batKnobWood:[[424.5,238],[435.5,231.5],[441.5,236],[435,244],[427.5,246],[424,241.5]]},
    entry:{batUpper:[[154.5,23.5],[169,11],[178,12.5],[222,62],[269,120.5],[266.5,125],[257.5,125.5],[153,32]],
      batLower:[[330,185],[338.5,179],[366.5,211],[360,216]],
      batKnobWood:[[414.5,261],[418.5,265],[416.5,271.5],[407,278.5],[399.5,273]]},
    drive:{batUpper:[[120,20],[133.5,11.5],[144.5,15],[228.5,142],[220.5,146.5],[116,30]],
      batKnobWood:[[405,338.5],[401.5,347],[394.5,349],[394,348.5]]},
    contact:{batUpper:[[496,330],[500,338],[500,346.5],[491,358],[483,358],[326.5,308],[325.5,301.5]],
      batKnobWood:[[269.5,299.5],[277.5,309],[271.5,309],[268.5,303]]},
    extend:{batUpper:[[368,130],[484,24.5],[496,28],[502,38],[499.5,50],[460,79],[375,134.5]]},
    finish:{batUpper:[[20.5,59.5],[30.5,44],[121,65.5],[184.5,87],[185.5,93.5],[183,98],[22.5,72],[20.5,67]],
      batLower:[[226.5,96],[287,111.5],[283.5,118.5],[224,106.5]]},
    unwind:{batUpper:[[65.5,35.5],[78.5,22],[85.5,23],[134,71],[208,155],[204.5,157.5],[198,156.5],[65,42]]},
    regrip:{batUpper:[[185.5,14.5],[198.5,5.5],[206,7],[262,82.5],[246,93],[182.5,24]],
      batLower:[[309.5,166.5],[316.5,159.5],[343,204.5],[338.5,207.5]],
      batKnobWood:[[368.5,262],[379.5,256],[384,260.5],[370.5,269.5],[368,266]]},
    bunt:{batUpper:[[335,245.5],[500,252],[504.5,259],[503,275],[497,282],[470,279],[335,252.5],[333.5,249]]}
  };
  const batSamples={
    ready:[[279,45],[314,90],[360,143],[310.8,93.2],[317.2,86.8]],
    load:[[311,45],[337,90],[366,140],[333.5,92],[340.5,88]],
    plant:[[280,45],[316,95],[357,143],[314.8,95.9],[317.2,94.1]],
    entry:[[185,45],[214,75],[247,108],[211.3,77.9],[216.7,72.1]],
    drive:[[151,48],[179,83],[210,124],[175.8,85.5],[182.2,80.5]],
    contact:[[340,309],[403,323],[472,340],[402.1,326.9],[403.9,319.1]],
    extend:[[394,120],[428,90],[470,51],[430.7,93],[425.3,87]],
    finish:[[55,70],[100,80],[153,92],[99.1,83.9],[100.9,76.1]],
    unwind:[[98,46],[132,83],[175,127],[129.2,85.8],[134.8,80.2]],
    regrip:[[211,37],[228,60],[246,83],[225.3,62.1],[230.7,57.9]],
    bunt:[[362,253],[419,260],[479,267],[418.5,264],[419.5,256]]
  };
  for(const[key,r]of Object.entries(bats)){
    const entry=art.batter[key];
    for(const[name,polygon]of Object.entries(r))entry.pins.surfaceRegions[name]={polygon,bone:['grip','batTip'],feather:0};
    for(const[i,p]of batSamples[key].entries())entry.surfaceChecks[['batWood0','batWood1','batWood2','batWoodWidthL','batWoodWidthR'][i]]=p;
  }
  // The regrip helmet's outer dome and ear flaps extend beyond an ellipse
  // around the central head pin. Trace the actual helmet, with a concave
  // lower rim above the hair, so its whole painted skull stays one piece.
  // This source-only region never recruits the jersey or the gloves.
  art.batter.regrip.pins.surfaceRegions.helmet={
    polygon:[[276,79],[303,84],[323,98],[329,116],[327,126],[341,139],[333,145],
      [320,142],[321,157],[314,168],[304,172],[293,166],[285,156],[263,143],
      [238,140],[234,151],[224,147],[223,131],[232,124],[219,119],
      [233,112],[240,99],[254,86]],bone:['neck','head'],feather:0};
  Object.assign(art.batter.regrip.surfaceChecks,{
    headDomeTop:[280,91],headDomeL:[247,111],headDomeR:[317,111]});
  // Complete, independent wooden bat. These four axial points were checked
  // on opaque source pixels (alpha 252/253). The visible native silhouette
  // spans x207..305,y10.5..758; the barrel is 98 native pixels across.
  // The renderer masks each body's old bat polygons and draws this one
  // continuous object behind the hands, helmet and jersey.
  global.BallparkBatArt={file:'wooden-bat-v6.png',sourcePixels:[1024,1536],normalizedPixels:[512,768],
    grip:[256,663],tip:[256,14],barrel:[256,91],knob:[256,746],acrossScale:.36};
})(typeof window==='object'?window:globalThis);
