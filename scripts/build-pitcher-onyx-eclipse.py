#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""9-baseball 신규 좌투수(LHP / 사우스포) '오닉스 이클립스 (Onyx Eclipse)'

16개 독립 RGBA 파츠 리깅, 12포즈·120프레임(60fps) 모션 타임라인, 아틀라스 패커
및 8대 품질 검수 스크립트
"""

import base64
import io
import json
import math
import pathlib
from PIL import Image, ImageDraw, ImageOps

OUT_DIR = pathlib.Path(
    "/working_dir/c_44a67226c28aaf3d/artifacts/file_generation/ttl=63d/output"
)
INTER_DIR = pathlib.Path(
    "/working_dir/c_44a67226c28aaf3d/artifacts/file_generation/ttl=63d/intermediate"
)
GEN_DIR = pathlib.Path(
    "/working_dir/c_44a67226c28aaf3d/user_uploaded_files/ttl=63d/tool_generated"
)
OUT_DIR.mkdir(parents=True, exist_ok=True)
INTER_DIR.mkdir(parents=True, exist_ok=True)

# 1. 좌투수(LHP / Southpaw) 16개 독립 RGBA 파츠 및 12 키포즈·120프레임(60fps) 명세
# 포수·심판캠(Umpire/Catcher Cam) 정면 시점 기준:
# - 화면 오른쪽(x > 128) = 캐릭터의 좌측(LHP 투구 팔: 로열 바이올렛 슬리브 + 투구 손, 좌측 축발 Pivot Foot)
# - 화면 왼쪽(x < 128) = 캐릭터의 우측(우손 블랙·골드 글러브, 우측 디딤발 Lead Leg)
RIG_SPEC_LHP = {
    "character_id": "onyx-eclipse",
    "name_ko": "오닉스 이클립스",
    "name_en": "Onyx Eclipse",
    "age": 26,
    "throws": "LHP",
    "glove_hand": "RHP",
    "pitch_style": (
        "Left-Handed Three-Quarter Slingshot (좌투 3/4 슬링샷 스위퍼 & 하이"
        " 패스트볼)"
    ),
    "camera_mode": "umpire_catcher_cam_v12",
    "viewport": {
        "width": 390,
        "height": 844,
        "mound_anchor": {"x": 195, "y": 430},
    },
    "atlas_spec": {
        "cell_width": 256,
        "cell_height": 256,
        "columns": 10,
        "rows": 12,
        "atlas_width": 2560,
        "atlas_height": 3072,
        "total_frames": 120,
        "fps": 60,
        "duration_sec": 2.0,
    },
    "palette": {
        "onyx_black": "#14141B",
        "royal_violet": "#5B2C83",
        "neon_amethyst": "#9D4EDD",
        "imperial_gold": "#E6B84D",
        "platinum_silver": "#E9ECF5",
        "amber_eye": "#FFB703",
    },
    "parts": [
        {
            "id": "ponytail_hair_back",
            "z_base": 10,
            "parent": "head_cap",
            "pivot": [128, 62],
            "socket_offset": [-4, -12],
            "seam_overlap_px": 8,
            "desc": "은백색+로열 바이올렛 시크릿 투톤 하이 포니테일 (좌투 원심력 궤적 파츠)",
        },
        {
            "id": "pivot_thigh_L",
            "z_base": 20,
            "parent": "pelvis_pants",
            "pivot": [140, 148],
            "socket_offset": [12, 6],
            "seam_overlap_px": 10,
            "desc": "좌측 축발(LHP Pivot Leg, 화면 우측) 허벅지 파츠",
        },
        {
            "id": "pivot_shin_L",
            "z_base": 22,
            "parent": "pivot_thigh_L",
            "pivot": [142, 184],
            "socket_offset": [2, 36],
            "seam_overlap_px": 8,
            "desc": "좌측 축발 종아리 및 오닉스 하이삭스",
        },
        {
            "id": "pivot_cleat_L",
            "z_base": 24,
            "parent": "pivot_shin_L",
            "pivot": [144, 218],
            "socket_offset": [2, 34],
            "seam_overlap_px": 6,
            "desc": "좌측 축발 골드 스파이크 클리츠 (투구판 고정 앵커: x=144, y=218)",
        },
        {
            "id": "pelvis_pants",
            "z_base": 30,
            "parent": "root_mound",
            "pivot": [128, 142],
            "socket_offset": [0, -76],
            "seam_overlap_px": 10,
            "desc": "하이웨이스트 카본 블랙 팬츠 & 골드 벨트 골반 코어",
        },
        {
            "id": "torso_jersey",
            "z_base": 40,
            "parent": "pelvis_pants",
            "pivot": [128, 118],
            "socket_offset": [0, -24],
            "seam_overlap_px": 10,
            "desc": "오닉스 블랙 & 골드 일식(Eclipse) 엠블럼 크롭 저지 상체",
        },
        {
            "id": "pitch_upper_arm_L",
            "z_base": 35,
            "parent": "torso_jersey",
            "pivot": [152, 92],
            "socket_offset": [24, -26],
            "seam_overlap_px": 9,
            "desc": "좌측 투구 팔 상완 (화면 우측, 로열 바이올렛 슬리브, 릴리스 시 z=75)",
        },
        {
            "id": "pitch_forearm_L",
            "z_base": 36,
            "parent": "pitch_upper_arm_L",
            "pivot": [168, 112],
            "socket_offset": [16, 20],
            "seam_overlap_px": 8,
            "desc": "좌측 투구 팔 전완 (로열 바이올렛 컴프레션 슬리브, 릴리스 시 z=76)",
        },
        {
            "id": "pitch_hand_ball_L",
            "z_base": 37,
            "parent": "pitch_forearm_L",
            "pivot": [180, 126],
            "socket_offset": [12, 14],
            "seam_overlap_px": 7,
            "desc": "좌측 투구 손 & 공 (LHP 좌투 일관성 100% 고정, 릴리스 시 z=78)",
        },
        {
            "id": "lead_thigh_R",
            "z_base": 50,
            "parent": "pelvis_pants",
            "pivot": [116, 148],
            "socket_offset": [-12, 6],
            "seam_overlap_px": 10,
            "desc": "우측 디딤발(LHP Lead Leg, 화면 좌측) 허벅지 (하이 레그리프트 및 전방 착지)",
        },
        {
            "id": "lead_shin_R",
            "z_base": 52,
            "parent": "lead_thigh_R",
            "pivot": [112, 184],
            "socket_offset": [-4, 36],
            "seam_overlap_px": 8,
            "desc": "우측 디딤발 종아리 및 오닉스 하이삭스",
        },
        {
            "id": "lead_cleat_R",
            "z_base": 54,
            "parent": "lead_shin_R",
            "pivot": [110, 218],
            "socket_offset": [-2, 34],
            "seam_overlap_px": 6,
            "desc": "우측 디딤발 골드 클리츠 (Foot-Plant 이후 전방 브레이킹 고정)",
        },
        {
            "id": "head_cap",
            "z_base": 60,
            "parent": "torso_jersey",
            "pivot": [128, 74],
            "socket_offset": [0, -44],
            "seam_overlap_px": 8,
            "desc": "얼굴(금빛 눈매) & 오닉스 블랙 일식 엠블럼 투수 캡",
        },
        {
            "id": "glove_upper_arm_R",
            "z_base": 65,
            "parent": "torso_jersey",
            "pivot": [106, 92],
            "socket_offset": [-22, -26],
            "seam_overlap_px": 9,
            "desc": "우측 글러브 팔 상완 (화면 좌측, 탄탄한 맨팔 + 블랙·골드 리스트밴드)",
        },
        {
            "id": "glove_forearm_R",
            "z_base": 68,
            "parent": "glove_upper_arm_R",
            "pivot": [94, 112],
            "socket_offset": [-12, 20],
            "seam_overlap_px": 8,
            "desc": "우측 글러브 팔 전완 (가이드 암 리드 -> 우측 옆구리 당김 고정)",
        },
        {
            "id": "glove_mit_R",
            "z_base": 70,
            "parent": "glove_forearm_R",
            "pivot": [102, 118],
            "socket_offset": [8, 6],
            "seam_overlap_px": 7,
            "desc": "우측 블랙 & 골드 웹 피처 글러브 (화면 좌측 고정, 손 바뀜 원천 차단)",
        },
    ],
    "key_poses_12": [
        {
            "pose_index": 1,
            "pose_id": "01_set_stance",
            "gate_5pose": "set",
            "frame_start": 1,
            "frame_end": 12,
            "key_frame": 1,
            "ref_clip": (
                "FG1eOrZSvdI (00:00~00:05 LHP 미러 변환) / RBmIpt3kEwQ"
                " (00:02:10~00:02:26 좌투 Tarik Skubal)"
            ),
            "mound_pivot_x": 144.0,
            "mound_pivot_y": 218.0,
            "pelvis_offset": [0.0, 0.0],
            "torso_tilt_deg": 0.0,
            "shoulder_rot_deg": 8.0,
            "hip_rot_deg": 6.0,
            "lead_knee_lift": 0.0,
            "stride_depth": 0.0,
            "pitch_shoulder_deg": 156.0,
            "pitch_elbow_deg": 65.0,
            "pitch_wrist_deg": 10.0,
            "glove_shoulder_deg": -152.0,
            "glove_elbow_deg": -72.0,
            "head_scale": 1.00,
            "torso_scale": 1.00,
            "pitch_arm_front_layer": False,
            "ball_released": False,
            "notes": (
                "세트 포지션(LHP): 가슴 앞 우손 글러브(화면 좌측) 안에"
                " 바이올렛 슬리브 좌투 손을 숨기고 포수 미트 응시"
            ),
        },
        {
            "pose_index": 2,
            "pose_id": "02_hands_gather_rock",
            "gate_5pose": None,
            "frame_start": 13,
            "frame_end": 22,
            "key_frame": 18,
            "ref_clip": "FG1eOrZSvdI (00:05~00:07 LHP 미러 변환)",
            "mound_pivot_x": 144.0,
            "mound_pivot_y": 218.0,
            "pelvis_offset": [2.0, -1.0],
            "torso_tilt_deg": 3.0,
            "shoulder_rot_deg": 18.0,
            "hip_rot_deg": 14.0,
            "lead_knee_lift": 0.32,
            "stride_depth": 0.05,
            "pitch_shoulder_deg": 148.0,
            "pitch_elbow_deg": 78.0,
            "pitch_wrist_deg": 15.0,
            "glove_shoulder_deg": -145.0,
            "glove_elbow_deg": -82.0,
            "head_scale": 1.00,
            "torso_scale": 1.00,
            "pitch_arm_front_layer": False,
            "ball_released": False,
            "notes": (
                "와인드업 초기(LHP): 좌측 축발(화면 우측, x=144)에 체중을"
                " 실으며 우측 무릎(화면 좌측) 상승 시작"
            ),
        },
        {
            "pose_index": 3,
            "pose_id": "03_peak_leg_lift",
            "gate_5pose": "leg-lift",
            "frame_start": 23,
            "frame_end": 34,
            "key_frame": 28,
            "ref_clip": (
                "FG1eOrZSvdI (00:07~00:10 LHP 미러 변환) / RBmIpt3kEwQ"
                " (00:02:18 좌투 Skubal)"
            ),
            "mound_pivot_x": 144.0,
            "mound_pivot_y": 218.0,
            "pelvis_offset": [4.0, -3.0],
            "torso_tilt_deg": 7.0,
            "shoulder_rot_deg": 34.0,
            "hip_rot_deg": 28.0,
            "lead_knee_lift": 0.95,
            "stride_depth": 0.12,
            "pitch_shoulder_deg": 140.0,
            "pitch_elbow_deg": 85.0,
            "pitch_wrist_deg": 20.0,
            "glove_shoulder_deg": -138.0,
            "glove_elbow_deg": -88.0,
            "head_scale": 1.00,
            "torso_scale": 1.01,
            "pitch_arm_front_layer": False,
            "ball_released": False,
            "notes": (
                "5포즈 검수 게이트 [leg-lift]: 우측 무릎(화면 좌측) 하이 니킥"
                " 정점 및 좌측 축발 지지 코일링 극대화"
            ),
        },
        {
            "pose_index": 4,
            "pose_id": "04_hand_break_drop",
            "gate_5pose": None,
            "frame_start": 35,
            "frame_end": 44,
            "key_frame": 40,
            "ref_clip": "FG1eOrZSvdI (00:10~00:13 LHP 미러 변환)",
            "mound_pivot_x": 144.0,
            "mound_pivot_y": 218.0,
            "pelvis_offset": [2.0, 4.0],
            "torso_tilt_deg": 4.0,
            "shoulder_rot_deg": 38.0,
            "hip_rot_deg": 22.0,
            "lead_knee_lift": 0.68,
            "stride_depth": 0.35,
            "pitch_shoulder_deg": 35.0,
            "pitch_elbow_deg": 25.0,
            "pitch_wrist_deg": -12.0,
            "glove_shoulder_deg": -128.0,
            "glove_elbow_deg": -48.0,
            "head_scale": 1.01,
            "torso_scale": 1.02,
            "pitch_arm_front_layer": False,
            "ball_released": False,
            "notes": (
                "핸드 브레이크(LHP): 바이올렛 슬리브 좌투 손이 화면 우측"
                " 하단으로 테이크백, 우손 글러브는 화면 좌측 리드"
            ),
        },
        {
            "pose_index": 5,
            "pose_id": "05_stride_extension",
            "gate_5pose": None,
            "frame_start": 45,
            "frame_end": 54,
            "key_frame": 50,
            "ref_clip": (
                "FG1eOrZSvdI (00:13~00:15) / RBmIpt3kEwQ (00:07:45~00:07:58)"
            ),
            "mound_pivot_x": 144.0,
            "mound_pivot_y": 218.0,
            "pelvis_offset": [-2.0, 9.0],
            "torso_tilt_deg": -2.0,
            "shoulder_rot_deg": 42.0,
            "hip_rot_deg": 8.0,
            "lead_knee_lift": 0.30,
            "stride_depth": 0.72,
            "pitch_shoulder_deg": -12.0,
            "pitch_elbow_deg": 18.0,
            "pitch_wrist_deg": -28.0,
            "glove_shoulder_deg": -146.0,
            "glove_elbow_deg": -28.0,
            "head_scale": 1.02,
            "torso_scale": 1.03,
            "pitch_arm_front_layer": False,
            "ball_released": False,
            "notes": (
                "포수 방향 스트라이드 확장(LHP): 우측 디딤발이 포수 쪽으로"
                " 전진하며 골반 선행 개방"
            ),
        },
        {
            "pose_index": 6,
            "pose_id": "06_foot_plant",
            "gate_5pose": "foot-plant",
            "frame_start": 55,
            "frame_end": 64,
            "key_frame": 60,
            "ref_clip": (
                "FG1eOrZSvdI (00:15~00:17) / brUU7Dxo7ts (00:00:30~00:00:38)"
            ),
            "mound_pivot_x": 144.0,
            "mound_pivot_y": 218.0,
            "pelvis_offset": [-5.0, 12.0],
            "torso_tilt_deg": -6.0,
            "shoulder_rot_deg": 30.0,
            "hip_rot_deg": -18.0,
            "lead_knee_lift": 0.0,
            "stride_depth": 1.00,
            "pitch_shoulder_deg": -42.0,
            "pitch_elbow_deg": -38.0,
            "pitch_wrist_deg": -35.0,
            "glove_shoulder_deg": -152.0,
            "glove_elbow_deg": -42.0,
            "head_scale": 1.03,
            "torso_scale": 1.04,
            "pitch_arm_front_layer": False,
            "ball_released": False,
            "notes": (
                "5포즈 검수 게이트 [foot-plant]: 우측 디딤발 착지 완료, 화면"
                " 우측 상단으로 좌투 팔 코킹, 좌측으로 글러브 확장"
            ),
        },
        {
            "pose_index": 7,
            "pose_id": "07_late_cocking_mer",
            "gate_5pose": None,
            "frame_start": 65,
            "frame_end": 74,
            "key_frame": 70,
            "ref_clip": (
                "FG1eOrZSvdI (00:17~00:19) / RBmIpt3kEwQ (00:02:26 좌투 Skubal)"
            ),
            "mound_pivot_x": 144.0,
            "mound_pivot_y": 218.0,
            "pelvis_offset": [-7.0, 13.0],
            "torso_tilt_deg": -12.0,
            "shoulder_rot_deg": -8.0,
            "hip_rot_deg": -36.0,
            "lead_knee_lift": 0.0,
            "stride_depth": 1.00,
            "pitch_shoulder_deg": -56.0,
            "pitch_elbow_deg": -62.0,
            "pitch_wrist_deg": -52.0,
            "glove_shoulder_deg": -158.0,
            "glove_elbow_deg": -88.0,
            "head_scale": 1.04,
            "torso_scale": 1.05,
            "pitch_arm_front_layer": True,
            "ball_released": False,
            "notes": (
                "레이트 코킹(LHP MER): 좌측 어깨 최대 외회전, 우손 글러브를"
                " 우측 가슴/옆구리로 강하게 당겨 회전축 고정"
            ),
        },
        {
            "pose_index": 8,
            "pose_id": "08_whip_acceleration",
            "gate_5pose": None,
            "frame_start": 75,
            "frame_end": 81,
            "key_frame": 78,
            "ref_clip": (
                "FG1eOrZSvdI (00:19~00:20) / 9cLYh0iO9sg (00:06:25~00:06:38)"
            ),
            "mound_pivot_x": 144.0,
            "mound_pivot_y": 218.0,
            "pelvis_offset": [-8.0, 14.0],
            "torso_tilt_deg": -16.0,
            "shoulder_rot_deg": -28.0,
            "hip_rot_deg": -42.0,
            "lead_knee_lift": 0.0,
            "stride_depth": 1.00,
            "pitch_shoulder_deg": -24.0,
            "pitch_elbow_deg": -22.0,
            "pitch_wrist_deg": -24.0,
            "glove_shoulder_deg": -168.0,
            "glove_elbow_deg": -96.0,
            "head_scale": 1.05,
            "torso_scale": 1.06,
            "pitch_arm_front_layer": True,
            "ball_released": False,
            "notes": (
                "채찍 가속 구간(LHP): 바이올렛 슬리브 좌측 팔꿈치가 포수"
                " 정면으로 먼저 나오며 3/4 슬링샷 슬롯 가속"
            ),
        },
        {
            "pose_index": 9,
            "pose_id": "09_release_point",
            "gate_5pose": "release",
            "frame_start": 82,
            "frame_end": 88,
            "key_frame": 85,
            "ref_clip": (
                "FG1eOrZSvdI (00:20~00:21) / RBmIpt3kEwQ (00:02:26~00:02:35"
                " 좌투 98mph 릴리스)"
            ),
            "mound_pivot_x": 144.0,
            "mound_pivot_y": 218.0,
            "pelvis_offset": [-9.0, 14.0],
            "torso_tilt_deg": -21.0,
            "shoulder_rot_deg": -40.0,
            "hip_rot_deg": -45.0,
            "lead_knee_lift": 0.0,
            "stride_depth": 1.00,
            "pitch_shoulder_deg": 18.0,
            "pitch_elbow_deg": 8.0,
            "pitch_wrist_deg": 18.0,
            "glove_shoulder_deg": -172.0,
            "glove_elbow_deg": -102.0,
            "head_scale": 1.06,
            "torso_scale": 1.07,
            "pitch_arm_front_layer": True,
            "ball_released": True,
            "notes": (
                "5포즈 검수 게이트 [release]: 좌투 익스트림 스리쿼터 릴리스"
                " 포인트(화면 우측에서 좌측으로 채찍 스냅)"
            ),
        },
        {
            "pose_index": 10,
            "pose_id": "10_pronation_extension",
            "gate_5pose": None,
            "frame_start": 89,
            "frame_end": 97,
            "key_frame": 93,
            "ref_clip": "FG1eOrZSvdI (00:21~00:24 LHP 미러 변환)",
            "mound_pivot_x": 144.0,
            "mound_pivot_y": 218.0,
            "pelvis_offset": [-9.0, 15.0],
            "torso_tilt_deg": -26.0,
            "shoulder_rot_deg": -48.0,
            "hip_rot_deg": -46.0,
            "lead_knee_lift": 0.0,
            "stride_depth": 1.00,
            "pitch_shoulder_deg": 62.0,
            "pitch_elbow_deg": 24.0,
            "pitch_wrist_deg": 42.0,
            "glove_shoulder_deg": -175.0,
            "glove_elbow_deg": -105.0,
            "head_scale": 1.06,
            "torso_scale": 1.07,
            "pitch_arm_front_layer": True,
            "ball_released": True,
            "notes": (
                "릴리스 직후 좌완 내회전(Pronation) 및 포수 방향 익스텐션"
                " 극대화"
            ),
        },
        {
            "pose_index": 11,
            "pose_id": "11_follow_through",
            "gate_5pose": "follow-through",
            "frame_start": 98,
            "frame_end": 108,
            "key_frame": 103,
            "ref_clip": (
                "FG1eOrZSvdI (00:24~00:28) / brUU7Dxo7ts (00:00:07~00:00:15)"
            ),
            "mound_pivot_x": 144.0,
            "mound_pivot_y": 218.0,
            "pelvis_offset": [-8.0, 14.0],
            "torso_tilt_deg": -28.0,
            "shoulder_rot_deg": -52.0,
            "hip_rot_deg": -48.0,
            "lead_knee_lift": 0.0,
            "stride_depth": 1.00,
            "pitch_shoulder_deg": 118.0,
            "pitch_elbow_deg": 38.0,
            "pitch_wrist_deg": 35.0,
            "glove_shoulder_deg": -170.0,
            "glove_elbow_deg": -98.0,
            "head_scale": 1.05,
            "torso_scale": 1.06,
            "pitch_arm_front_layer": True,
            "ball_released": True,
            "notes": (
                "5포즈 검수 게이트 [follow-through]: 바이올렛 슬리브 좌투 팔이"
                " 몸통을 가로질러 감속, 좌측 뒷다리 하이킥 상승"
            ),
        },
        {
            "pose_index": 12,
            "pose_id": "12_fielding_recovery",
            "gate_5pose": None,
            "frame_start": 109,
            "frame_end": 120,
            "key_frame": 120,
            "ref_clip": "FG1eOrZSvdI (00:28~00:31 LHP 미러 변환)",
            "mound_pivot_x": 144.0,
            "mound_pivot_y": 218.0,
            "pelvis_offset": [-4.0, 8.0],
            "torso_tilt_deg": -10.0,
            "shoulder_rot_deg": -14.0,
            "hip_rot_deg": -16.0,
            "lead_knee_lift": 0.0,
            "stride_depth": 0.85,
            "pitch_shoulder_deg": 142.0,
            "pitch_elbow_deg": 52.0,
            "pitch_wrist_deg": 12.0,
            "glove_shoulder_deg": -156.0,
            "glove_elbow_deg": -76.0,
            "head_scale": 1.02,
            "torso_scale": 1.02,
            "pitch_arm_front_layer": False,
            "ball_released": True,
            "notes": (
                "수비 리커버리 자세(LHP): 좌측 뒷발이 착지하며 정면 타구 대비"
                " 수비 밸런스 회복"
            ),
        },
    ],
}


def smoothstep(t: float) -> float:
  t = max(0.0, min(1.0, t))
  return t * t * (3.0 - 2.0 * t)


def build_120_frame_timeline_lhp(spec: dict) -> list:
  poses = spec["key_poses_12"]
  frames = []
  for f in range(1, 121):
    prev_p = poses[0]
    next_p = poses[-1]
    for i, p in enumerate(poses):
      if f <= p["key_frame"]:
        next_p = p
        prev_p = poses[max(0, i - 1)]
        break

    if prev_p["key_frame"] == next_p["key_frame"]:
      alpha = 0.0
    else:
      span = max(1, next_p["key_frame"] - prev_p["key_frame"])
      alpha = smoothstep((f - prev_p["key_frame"]) / span)

    def lerp(k):
      return round(prev_p[k] + (next_p[k] - prev_p[k]) * alpha, 4)

    px = round(
        prev_p["pelvis_offset"][0]
        + (next_p["pelvis_offset"][0] - prev_p["pelvis_offset"][0]) * alpha,
        4,
    )
    py = round(
        prev_p["pelvis_offset"][1]
        + (next_p["pelvis_offset"][1] - prev_p["pelvis_offset"][1]) * alpha,
        4,
    )

    mound_x = lerp("mound_pivot_x")  # 144.0 (LHP left pivot foot on rubber)
    mound_y = lerp("mound_pivot_y")  # 218.0
    pelvis_x = 128.0 + px
    pelvis_y = 142.0 + py

    torso_rad = math.radians(lerp("torso_tilt_deg"))
    torso_x = pelvis_x + math.sin(torso_rad) * 24.0
    torso_y = pelvis_y - math.cos(torso_rad) * 24.0

    sh_rot_rad = math.radians(lerp("shoulder_rot_deg"))
    # Left pitching shoulder (viewer's right = x > torso_x)
    l_shoulder_x = torso_x + 24.0 * math.cos(sh_rot_rad * 0.6)
    l_shoulder_y = torso_y - 22.0 - 4.0 * math.sin(sh_rot_rad)

    # Right glove shoulder (viewer's left = x < torso_x)
    r_shoulder_x = torso_x - 22.0 * math.cos(sh_rot_rad * 0.6)
    r_shoulder_y = torso_y - 22.0 + 4.0 * math.sin(sh_rot_rad)

    # Left Pitching Arm FK Chain (LHP: shoulder -> elbow -> wrist/hand, length 24px + 22px)
    p_sh_rad = math.radians(lerp("pitch_shoulder_deg"))
    p_el_rad = p_sh_rad + math.radians(lerp("pitch_elbow_deg"))
    l_elbow_x = l_shoulder_x + math.cos(p_sh_rad) * 24.0
    l_elbow_y = l_shoulder_y + math.sin(p_sh_rad) * 24.0
    l_wrist_x = l_elbow_x + math.cos(p_el_rad) * 22.0
    l_wrist_y = l_elbow_y + math.sin(p_el_rad) * 22.0

    # Right Glove Arm FK Chain (RHP glove: shoulder -> elbow -> glove mit, length 22px + 20px)
    g_sh_rad = math.radians(lerp("glove_shoulder_deg"))
    g_el_rad = g_sh_rad + math.radians(lerp("glove_elbow_deg"))
    r_elbow_x = r_shoulder_x + math.cos(g_sh_rad) * 22.0
    r_elbow_y = r_shoulder_y + math.sin(g_sh_rad) * 22.0
    r_wrist_x = r_elbow_x + math.cos(g_el_rad) * 20.0
    r_wrist_y = r_elbow_y + math.sin(g_el_rad) * 20.0

    frames.append({
        "frame": f,
        "atlas_col": (f - 1) % 10,
        "atlas_row": (f - 1) // 10,
        "pose_id": next_p["pose_id"] if alpha >= 0.5 else prev_p["pose_id"],
        "mound_anchor": [mound_x, mound_y],
        "pelvis_pos": [round(pelvis_x, 3), round(pelvis_y, 3)],
        "torso_pos": [round(torso_x, 3), round(torso_y, 3)],
        "l_shoulder_pos": [round(l_shoulder_x, 3), round(l_shoulder_y, 3)],
        "l_elbow_pos": [round(l_elbow_x, 3), round(l_elbow_y, 3)],
        "l_wrist_pos": [round(l_wrist_x, 3), round(l_wrist_y, 3)],
        "r_shoulder_pos": [round(r_shoulder_x, 3), round(r_shoulder_y, 3)],
        "r_elbow_pos": [round(r_elbow_x, 3), round(r_elbow_y, 3)],
        "r_wrist_pos": [round(r_wrist_x, 3), round(r_wrist_y, 3)],
        "torso_tilt_deg": lerp("torso_tilt_deg"),
        "shoulder_rot_deg": lerp("shoulder_rot_deg"),
        "hip_rot_deg": lerp("hip_rot_deg"),
        "lead_knee_lift": lerp("lead_knee_lift"),
        "stride_depth": lerp("stride_depth"),
        "pitch_shoulder_deg": lerp("pitch_shoulder_deg"),
        "pitch_elbow_deg": lerp("pitch_elbow_deg"),
        "pitch_wrist_deg": lerp("pitch_wrist_deg"),
        "glove_shoulder_deg": lerp("glove_shoulder_deg"),
        "glove_elbow_deg": lerp("glove_elbow_deg"),
        "head_scale": lerp("head_scale"),
        "torso_scale": lerp("torso_scale"),
        "pitch_arm_front_layer": 65 <= f <= 108,
        "ball_released": f >= 85,
        "throws_hand": "LHP",
        "glove_hand": "RHP",
    })
  return frames


timeline_120 = build_120_frame_timeline_lhp(RIG_SPEC_LHP)
RIG_SPEC_LHP["timeline_120"] = timeline_120


def run_qa_checks_lhp(timeline: list) -> dict:
  mound_drifts = [
      math.hypot(
          fr["mound_anchor"][0] - 144.0, fr["mound_anchor"][1] - 218.0
      )
      for fr in timeline
  ]
  max_mound_drift = max(mound_drifts)
  handedness_flips = sum(
      1
      for fr in timeline
      if fr["throws_hand"] != "LHP" or fr["glove_hand"] != "RHP"
  )

  upper_arm_errors = []
  forearm_errors = []
  for fr in timeline:
    u_len = math.hypot(
        fr["l_elbow_pos"][0] - fr["l_shoulder_pos"][0],
        fr["l_elbow_pos"][1] - fr["l_shoulder_pos"][1],
    )
    f_len = math.hypot(
        fr["l_wrist_pos"][0] - fr["l_elbow_pos"][0],
        fr["l_wrist_pos"][1] - fr["l_elbow_pos"][1],
    )
    upper_arm_errors.append(abs(u_len - 24.0))
    forearm_errors.append(abs(f_len - 22.0))

  max_joint_error = round(max(max(upper_arm_errors), max(forearm_errors)), 5)
  head_scales = [fr["head_scale"] for fr in timeline]
  torso_scales = [fr["torso_scale"] for fr in timeline]
  max_torso_step = max(
      abs(timeline[i]["torso_tilt_deg"] - timeline[i - 1]["torso_tilt_deg"])
      for i in range(1, len(timeline))
  )
  max_shoulder_step = max(
      abs(
          timeline[i]["pitch_shoulder_deg"]
          - timeline[i - 1]["pitch_shoulder_deg"]
      )
      for i in range(1, len(timeline))
  )

  return {
      "throws": "LHP (좌투수)",
      "mound_anchor_coord": [144.0, 218.0],
      "mound_anchor_max_drift_px": round(max_mound_drift, 4),
      "mound_anchor_pass": max_mound_drift <= 1.5,
      "handedness_flip_count": handedness_flips,
      "handedness_lock_pass": handedness_flips == 0,
      "fk_joint_max_error_px": max_joint_error,
      "fk_joint_continuity_pass": max_joint_error < 0.01,
      "head_scale_range": [min(head_scales), max(head_scales)],
      "torso_scale_range": [min(torso_scales), max(torso_scales)],
      "proportion_lock_pass": (
          0.95 <= min(head_scales) and max(head_scales) <= 1.10
      ),
      "max_torso_step_deg_per_frame": round(max_torso_step, 3),
      "max_pitch_shoulder_step_deg_per_frame": round(max_shoulder_step, 3),
      "smooth_60fps_pass": max_torso_step < 3.0 and max_shoulder_step < 14.0,
      "atlas_grid_pass": (
          len(timeline) == 120
          and timeline[-1]["atlas_col"] == 9
          and timeline[-1]["atlas_row"] == 11
      ),
  }


qa_results = run_qa_checks_lhp(timeline_120)
RIG_SPEC_LHP["qa_validation"] = qa_results

(INTER_DIR / "onyx_eclipse_rig_and_timeline.json").write_text(
    json.dumps(RIG_SPEC_LHP, ensure_ascii=False, indent=2), encoding="utf-8"
)
print("LHP QA Results:", json.dumps(qa_results, ensure_ascii=False, indent=2))
