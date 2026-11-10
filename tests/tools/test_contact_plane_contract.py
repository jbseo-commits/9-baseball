"""Analytic controls for the offline mask metric, without a production collider."""
import importlib.util
import math
from pathlib import Path
import unittest

spec=importlib.util.spec_from_file_location('contact_contract',Path(__file__).resolve().parents[2]/'scripts/build-contact-plane-contract.py')
tool=importlib.util.module_from_spec(spec)
spec.loader.exec_module(tool)


class PixelUnionDistance(unittest.TestCase):
    def test_inside_and_boundary_are_zero(self):
        for p in [(10.2,20.8),(12,21),(12,22)]:
            self.assertEqual(tool.distance_to_pixels(p,[(0,0)],(10,20),2),0)

    def test_scaled_offset_corner_distance(self):
        self.assertAlmostEqual(tool.distance_to_pixels((15,24),[(0,0)],(10,20),2),math.sqrt(13))

    def test_transparent_hole_is_not_filled_by_bounding_box(self):
        self.assertEqual(tool.distance_to_pixels((4.5,.5),[(0,0),(8,0)],(0,0),1),3.5)

    def test_distance_is_not_rounded_before_disk_classification(self):
        distance=tool.distance_to_pixels((9.00001,.5),[(0,0)],(0,0),1)
        self.assertGreater(distance,8)
        self.assertEqual(round(distance,4),8)

    def test_empty_mask_is_invalid(self):
        with self.assertRaises(ValueError):
            tool.distance_to_pixels((0,0),[],(0,0),1)

    def test_output_cannot_overwrite_game_entry_or_source(self):
        for suffix in ('','assets','src','public','dist','.git','tests'):
            with self.subTest(suffix=suffix),self.assertRaises(ValueError):
                tool.build(tool.REPO/suffix)


if __name__=='__main__':
    unittest.main()
