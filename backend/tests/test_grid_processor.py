import tempfile
import unittest

import numpy as np

from src.utils.grid_processor import (
    iter_grid_cells,
    perform_crop_and_save,
    resolve_frame_points,
)


class ResolveFramePointsTests(unittest.TestCase):
    def test_preserves_point_roles_across_orientations(self):
        cases = [
            ("ㄱ", [0, 0], [12, 0], [0, 8], 12.0, 8.0, (1.0, 0.0), (0.0, 1.0)),
            ("ㄴ", [12, 0], [12, 8], [0, 8], 8.0, 12.0, (0.0, 1.0), (-1.0, 0.0)),
            ("┘", [12, 8], [0, 8], [12, 0], 12.0, 8.0, (-1.0, 0.0), (0.0, -1.0)),
            ("┌", [0, 8], [0, 0], [12, 8], 8.0, 12.0, (0.0, -1.0), (1.0, 0.0)),
        ]

        for (
            label,
            p1,
            p2,
            p3,
            expected_dist_x,
            expected_dist_y,
            expected_x,
            expected_y,
        ) in cases:
            with self.subTest(label=label):
                frame = resolve_frame_points(p1, p2, p3)

                self.assertAlmostEqual(frame["dist_x"], expected_dist_x)
                self.assertAlmostEqual(frame["dist_y"], expected_dist_y)
                self.assertAlmostEqual(frame["unit_x"][0], expected_x[0])
                self.assertAlmostEqual(frame["unit_x"][1], expected_x[1])
                self.assertAlmostEqual(frame["unit_y"][0], expected_y[0])
                self.assertAlmostEqual(frame["unit_y"][1], expected_y[1])

    def test_rejects_too_short_primary_axis(self):
        with self.assertRaisesRegex(ValueError, "1차 축"):
            resolve_frame_points([0, 0], [1, 1], [0, 10])

    def test_rejects_nearly_collinear_points(self):
        with self.assertRaisesRegex(ValueError, "2차 축"):
            resolve_frame_points([0, 0], [12, 0], [11.9, 0.1])


class CropModeTests(unittest.TestCase):
    def test_visible_grid_mode_saves_single_file(self):
        warped = np.full((10, 10, 3), 255, dtype=np.uint8)
        cell = {
            "cluster_number": 1,
            "x": 0,
            "y": 0,
            "cell_width": 10,
            "cell_height": 10,
        }
        layout = {"crop_mode": "visible_grid", "patch_size": 5}

        with tempfile.TemporaryDirectory() as temp_dir:
            saved_count = perform_crop_and_save(
                warped, cell, layout, temp_dir, "20260317"
            )

            self.assertEqual(saved_count, 1)

    def test_fixed_pixel_split_mode_saves_multiple_files(self):
        warped = np.full((10, 10, 3), 255, dtype=np.uint8)
        cell = {
            "cluster_number": 1,
            "x": 0,
            "y": 0,
            "cell_width": 10,
            "cell_height": 10,
        }
        layout = {"crop_mode": "fixed_pixel_split", "patch_size": 5}

        with tempfile.TemporaryDirectory() as temp_dir:
            saved_count = perform_crop_and_save(
                warped, cell, layout, temp_dir, "20260317"
            )

            self.assertEqual(saved_count, 4)

    def test_iter_grid_cells_follows_primary_then_secondary_order(self):
        layout = {
            "group_direction": "horizontal",
            "groups": 1,
            "rows": 3,
            "cols": 4,
            "margin": 0,
            "group_width": 40,
            "group_height": 30,
            "group_gap": 0,
            "row_gap": 0,
            "col_gap": 0,
            "cell_width": 10,
            "cell_height": 10,
            "start_number": 1,
        }

        cells = list(iter_grid_cells(layout))

        self.assertEqual([cell["cluster_number"] for cell in cells], list(range(1, 13)))
        self.assertEqual(cells[0]["x"], 0)
        self.assertEqual(cells[1]["x"], 10)
        self.assertEqual(cells[4]["y"], 10)


if __name__ == "__main__":
    unittest.main()
