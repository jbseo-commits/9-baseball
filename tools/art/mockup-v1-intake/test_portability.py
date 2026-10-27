"""Regression for the Windows autocrlf false failure reported by Claude C02/C03.

python -m unittest discover -s tools/art/mockup-v1-intake -p 'test_*.py'
"""
import contextlib
import importlib.util
import io
from pathlib import Path
import shutil
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('intake_prepare', Path(__file__).with_name('prepare.py'))
prepare = importlib.util.module_from_spec(spec)
spec.loader.exec_module(prepare)


class PortabilityTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.original = prepare.OUTPUT
        self.output = Path(self.temp.name) / 'intake'
        shutil.copytree(self.original, self.output)
        prepare.OUTPUT = self.output

    def tearDown(self):
        prepare.OUTPUT = self.original
        self.temp.cleanup()

    def verify(self):
        with contextlib.redirect_stdout(io.StringIO()):
            prepare.check()

    def crlf_metadata(self):
        for name in ('scene-layout.json', 'actor-coverage.json', 'manifest.json'):
            path = self.output / name
            path.write_bytes(path.read_bytes().replace(b'\r\n', b'\n').replace(b'\n', b'\r\n'))

    def test_crlf_checkout_passes_without_rewriting_files(self):
        self.crlf_metadata()
        before = {f.name: f.read_bytes() for f in self.output.glob('*.json')}
        self.verify()
        self.assertEqual(before, {f.name: f.read_bytes() for f in self.output.glob('*.json')})

    def test_changed_geometry_still_fails_with_crlf(self):
        self.crlf_metadata()
        path = self.output / 'scene-layout.json'
        old = path.read_bytes()
        new = old.replace(b'"width": 1672', b'"width": 1673')
        self.assertNotEqual(old, new)
        path.write_bytes(new)
        with self.assertRaisesRegex(ValueError, 'Metadata changed'):
            self.verify()

    def test_changed_binary_still_fails_with_crlf(self):
        self.crlf_metadata()
        path = self.output / 'batter-catcher.webp'
        path.write_bytes(path.read_bytes() + b'changed')
        with self.assertRaisesRegex(ValueError, 'Derivative hash/size changed'):
            self.verify()


if __name__ == '__main__':
    unittest.main()
