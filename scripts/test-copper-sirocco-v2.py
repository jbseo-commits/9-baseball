"""Regression checks for the V2 foot-slide and release-state contracts."""
import copy
import importlib.util
import json
import unittest
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('builder', ROOT / 'scripts/build-copper-sirocco-v2.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


class PitcherContract(unittest.TestCase):
    def setUp(self):
        self.poses = json.loads((builder.ASSET / 'landmarks.json').read_text())['poses']

    def test_phase_landmarks_are_consistent(self):
        builder.validate_landmarks(self.poses)

    def test_per_pose_centering_cannot_reintroduce_slide(self):
        changed = copy.deepcopy(self.poses)
        changed['release']['groundAnchorTarget'][0] -= 50
        with self.assertRaisesRegex(ValueError, 'share its phase target'):
            builder.validate_landmarks(changed)

    def test_wrong_planted_leg_is_rejected(self):
        changed = copy.deepcopy(self.poses)
        changed['arm-cocking']['anchorFoot'] = 'right-pivot'
        with self.assertRaisesRegex(ValueError, 'share its phase target'):
            builder.validate_landmarks(changed)

    def test_hand_switch_is_rejected(self):
        changed = copy.deepcopy(self.poses)
        changed['overhead-windup']['handedness'] = 'left-ball-right-glove'
        with self.assertRaisesRegex(ValueError, 'handedness'):
            builder.validate_landmarks(changed)

    def test_ball_must_leave_hand_at_release(self):
        changed = copy.deepcopy(self.poses)
        changed['release']['ballState'] = 'held-right'
        with self.assertRaisesRegex(ValueError, 'release-state'):
            builder.validate_landmarks(changed)

    def test_release_timing_matches_existing_cue(self):
        frame = 0
        for _, _, label, duration in builder.TIMELINE:
            if label == 'release':
                self.assertEqual(frame, 76)
            frame += duration
        self.assertEqual(frame, 120)

    def test_png_output_is_complete_and_decodes(self):
        from PIL import Image
        picture = Image.open(builder.ASSET / 'source/copper-sirocco-portrait.png').convert('RGBA')
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'portrait.png'
            builder.write_png(path, picture)
            with Image.open(path) as saved:
                saved.verify()
            with Image.open(path) as saved:
                self.assertEqual(saved.tobytes(), picture.tobytes())


if __name__ == '__main__':
    unittest.main()
