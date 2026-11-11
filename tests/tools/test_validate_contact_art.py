"""Non-actor mask controls for source-over and the offline contact gate."""
import importlib.util
from pathlib import Path
import unittest
import contextlib
import hashlib
import io
import json
import tempfile
from types import SimpleNamespace
from unittest.mock import patch

from PIL import Image,ImageDraw

spec=importlib.util.spec_from_file_location('contact_validator',Path(__file__).resolve().parents[2]/'scripts/validate-contact-art.py')
tool=importlib.util.module_from_spec(spec)
spec.loader.exec_module(tool)

PATCHES={'rear':[130,625,235,665],'front':[400,632,550,651]}
CRITERIA={'registrationGate':{'footPatchAlpha128IoUMin':.75,'toeSoleBoundaryMaxDriftNativePx':4},'footPatchesNative':PATCHES}


def sole_masks(offset=0,heel_extra=False):
    image=Image.new('RGBA',(724,724))
    draw=ImageDraw.Draw(image)
    draw.rectangle((150+offset,632,219+offset,657),fill=(20,30,40,255))
    if heel_extra: draw.rectangle((140,632,149,638),fill=(20,30,40,255))
    draw.rectangle((420,635,519,647),fill=(20,30,40,255))
    return image


def pack(images):
    sheet=Image.new('RGBA',(2172,724))
    for i,image in enumerate(images):sheet.alpha_composite(image,(724*i,0))
    return sheet


def contract():
    return {'registration':{'originWorld':[0,0],'scale':1},'ballProposal':{'radiusAtPlaneWorldPx':8},
            'targets':[{'zone':r*3+c,'world':[500+c*50,100+r*100]} for r in range(3) for c in range(3)]}


class ContactArtGate(unittest.TestCase):
    def test_alpha_one_rgb_is_not_an_opaque_halo(self):
        image=Image.new('RGBA',(1,1),(255,0,0,1));original=image.tobytes()
        self.assertEqual(tool.source_over(image,(0,0,0)).getpixel((0,0)),(1,0,0))
        self.assertEqual(tool.source_over(image,(255,255,255)).getpixel((0,0)),(255,254,254))
        evidence=tool.alpha_evidence(image)
        self.assertEqual(evidence['nearPureRedOrYellowAlphaAtMost2'],1)
        self.assertEqual(evidence['nearPureRedOrYellowAlphaAtLeast128'],0)
        self.assertEqual(image.tobytes(),original)

    def test_heel_outline_can_change_with_fixed_toe_and_sole(self):
        result=tool.foot_registration(sole_masks(heel_extra=True),sole_masks(),PATCHES)
        self.assertTrue(result['pass'])
        self.assertGreater(result['patches']['rear']['allBoundsDriftIn724CellPixels'],4)
        self.assertEqual(result['patches']['rear']['boundaryDriftIn724CellPixels'],0)

    def test_actual_toe_translation_fails_even_with_similar_masks(self):
        result=tool.foot_registration(sole_masks(offset=10),sole_masks(),PATCHES)
        self.assertFalse(result['pass'])
        self.assertEqual(result['patches']['rear']['boundaryDriftIn724CellPixels'],10)

    def test_planted_front_heel_translation_is_not_free(self):
        reference=sole_masks();candidate=reference.copy()
        ImageDraw.Draw(candidate).rectangle((415,635,419,647),fill=(20,30,40,255))
        result=tool.foot_registration(candidate,reference,PATCHES)
        self.assertFalse(result['pass'])
        self.assertEqual(result['patches']['front']['boundaryDriftIn724CellPixels'],5)

    def test_one_bad_pose_skips_all_contact_acceptance(self):
        reference=sole_masks();sheet=pack([reference,reference,sole_masks(offset=20)])
        with patch.object(tool.metric,'distance_to_pixels',side_effect=AssertionError('Must not measure unregistered art')):
            result,_=tool.analyze(sheet,reference,contract(),CRITERIA,[])
        self.assertEqual(result['status'],'REGISTRATION_FAILED')
        self.assertEqual(result['contactStatus'],'NOT_EVALUATED')
        self.assertFalse(result['runtimeApproved'])

    def test_foot_pass_without_barrel_annotation_is_not_contact_pass(self):
        reference=sole_masks();result,_=tool.analyze(pack([reference]*3),reference,contract(),CRITERIA)
        self.assertTrue(result['registrationPass'])
        self.assertEqual(result['contactStatus'],'NOT_EVALUATED')

    def test_geometry_pass_never_approves_anatomy_or_runtime(self):
        reference=sole_masks();images=[];annotations=[]
        for row in range(3):
            image=reference.copy();y=100+row*100
            ImageDraw.Draw(image).rectangle((490,y-10,610,y+10),fill=(20,30,40,255));images.append(image)
            annotations.append({'barrelRoiIn724Cell':[480,y-20,620,y+20]})
        result,_=tool.analyze(pack(images),reference,contract(),CRITERIA,annotations)
        self.assertEqual(result['status'],'GEOMETRY_REVIEW_READY')
        self.assertFalse(result['runtimeApproved'])

    def test_transparent_gap_inside_roi_cannot_become_contact(self):
        reference=sole_masks();images=[];annotations=[]
        for row in range(3):
            image=reference.copy();y=100+row*100;d=ImageDraw.Draw(image)
            d.rectangle((490,y-10,510,y+10),fill=(20,30,40,255));d.rectangle((590,y-10,610,y+10),fill=(20,30,40,255));images.append(image)
            annotations.append({'barrelRoiIn724Cell':[480,y-20,620,y+20]})
        result,_=tool.analyze(pack(images),reference,contract(),CRITERIA,annotations)
        self.assertEqual(result['status'],'CONTACT_FAILED')

    def test_invalid_sheet_and_game_output_paths_are_rejected(self):
        with self.assertRaises(ValueError):tool.analyze(Image.new('RGBA',(724,724)),sole_masks(),contract(),CRITERIA)
        for path in [tool.REPO,tool.REPO/'assets',tool.REPO/'src']:
            with self.assertRaises(ValueError):tool.validate_output(path)

    def test_report_pins_the_manually_reviewed_barrel_input(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);reference=sole_masks();reference.save(root/'reference.png')
            pack([reference]*3).save(root/'sheet.png')
            criteria={**CRITERIA,'approvedFramePngSha256':hashlib.sha256((root/'reference.png').read_bytes()).hexdigest()}
            (root/'criteria.json').write_text(json.dumps(criteria))
            (root/'contract.json').write_text(json.dumps(contract()))
            annotations=[{'barrelRoiIn724Cell':[490,90,610,110]}]*3
            (root/'barrels.json').write_text(json.dumps(annotations))
            args=SimpleNamespace(sheet=root/'sheet.png',reference=root/'reference.png',criteria=root/'criteria.json',
                                 contract=root/'contract.json',barrels=root/'barrels.json',out=root/'report')
            # The assertion concerns source provenance, not a synthetic art pass.
            with patch.object(tool,'analyze',return_value=({'status':'CONTACT_FAILED','contactStatus':'FAIL','registrationPass':True},[])):
                with contextlib.redirect_stdout(io.StringIO()):self.assertEqual(tool.run(args),2)
            report=json.loads((args.out/'report.json').read_text())
            self.assertEqual(report['sources']['barrels']['sha256'],hashlib.sha256(args.barrels.read_bytes()).hexdigest())
            self.assertEqual(report['reviewedBarrelAnnotations'],annotations)


if __name__=='__main__':unittest.main()
