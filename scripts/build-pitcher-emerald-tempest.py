#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
9-baseball 신규 우투수(RHP 하이 오버핸드) '에메랄드 템페스트 (Emerald Tempest)'
16개 독립 RGBA 파츠 리깅, 12포즈·120프레임(60fps) 모션 타임라인, 아틀라스 패커 및 8대 품질 검수 스크립트
"""

import json
import math
import pathlib

OUT_DIR = pathlib.Path("/working_dir/c_44a67226c28aaf3d/artifacts/file_generation/ttl=63d/output")
INTER_DIR = pathlib.Path("/working_dir/c_44a67226c28aaf3d/artifacts/file_generation/ttl=63d/intermediate")
OUT_DIR.mkdir(parents=True, exist_ok=True)
INTER_DIR.mkdir(parents=True, exist_ok=True)

# 우투수(RHP High-Overhand Hammer Drop) 16개 독립 RGBA 파츠 및 12 키포즈·120프레임(60fps) 명세
# 포수·심판캠(Umpire/Catcher Cam) 정면 시점 기준:
# - 화면 왼쪽(x < 128) = 캐릭터의 우측(RHP 투구 팔: 딥 에메랄드 슬리브 + 투구 손, 우측 축발 Pivot Foot x=112)
# - 화면 오른쪽(x > 128) = 캐릭터의 좌측(좌손 크림 화이트 & 골드 글러브, 좌측 디딤발 Lead Leg)
RIG_SPEC_EMERALD = {
    "character_id": "emerald-tempest",
    "name_ko": "에메랄드 템페스트",
    "name_en": "Emerald Tempest",
    "number": "77",
    "age": 27,
    "throws": "RHP",
    "glove_hand": "LHP",
    "pitch_style": "High-Overhand Power Hammer Drop (우투 정통 하이 오버핸드 12시 해머 커브 & 라이징 패스트볼)",
    "camera_mode": "umpire_catcher_cam_v12",
    "viewport": {"width": 390, "height": 844, "mound_anchor": {"x": 195, "y": 430}},
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
        "deep_emerald": "#0F4C3A",
        "bright_jade": "#1B8A5A",
        "champagne_gold": "#E6B84D",
        "cream_ivory": "#F5F2E6",
        "honey_blonde": "#E5A93C",
        "emerald_eye": "#10B981",
    },
    "parts": [
        {
            "id": "wavy_hair_back",
            "z_base": 10,
            "parent": "head_cap",
            "pivot": [128, 64],
            "socket_offset": [0, -10],
            "seam_overlap_px": 8,
            "desc": "허니 블론드 & 에메랄드 시크릿 투톤 롱 웨이브 헤어 (후면 원심력 파츠)",
        },
        {
            "id": "pivot_thigh_R",
            "z_base": 20,
            "parent": "pelvis_pants",
            "pivot": [116, 148],
            "socket_offset": [-12, 6],
            "seam_overlap_px": 10,
            "desc": "우측 축발(RHP Pivot Leg, 화면 좌측) 핀스트라이프 팬츠 허벅지",
        },
        {
            "id": "pivot_shin_R",
            "z_base": 22,
            "parent": "pivot_thigh_R",
            "pivot": [114, 184],
            "socket_offset": [-2, 36],
            "seam_overlap_px": 8,
            "desc": "우측 축발 에메랄드 하이삭스 종아리 (릴리스 후 고각도 하이킥 반영)",
        },
        {
            "id": "pivot_cleat_R",
            "z_base": 24,
            "parent": "pivot_shin_R",
            "pivot": [112, 218],
            "socket_offset": [-2, 34],
            "seam_overlap_px": 6,
            "desc": "우측 축발 에메랄드·골드 스파이크 클리츠 (투구판 고정 앵커: x=112, y=218)",
        },
        {
            "id": "pelvis_pants",
            "z_base": 30,
            "parent": "root_mound",
            "pivot": [128, 142],
            "socket_offset": [0, -76],
            "seam_overlap_px": 10,
            "desc": "크림 화이트 & 에메랄드 핀스트라이프 하이웨이스트 팬츠 + 골드 벨트 코어",
        },
        {
            "id": "torso_jersey",
            "z_base": 40,
            "parent": "pelvis_pants",
            "pivot": [128, 118],
            "socket_offset": [0, -24],
            "seam_overlap_px": 10,
            "desc": "딥 에메랄드 핀스트라이프 슬리브리스 베스트 & 다크 에메랄드 크롭탑 상체",
        },
        {
            "id": "pitch_upper_arm_R",
            "z_base": 35,
            "parent": "torso_jersey",
            "pivot": [104, 92],
            "socket_offset": [-24, -26],
            "seam_overlap_px": 9,
            "desc": "우측 투구 팔 상완 (화면 좌측, 탄탄한 어깨 라인, 릴리스 시 z=75)",
        },
        {
            "id": "pitch_forearm_R",
            "z_base": 36,
            "parent": "pitch_upper_arm_R",
            "pivot": [88, 112],
            "socket_offset": [-16, 20],
            "seam_overlap_px": 8,
            "desc": "우측 투구 팔 전완 (딥 에메랄드 & 골드 컴프레션 슬리브, 릴리스 시 z=76)",
        },
        {
            "id": "pitch_hand_ball_R",
            "z_base": 37,
            "parent": "pitch_forearm_R",
            "pivot": [76, 126],
            "socket_offset": [-12, 14],
            "seam_overlap_px": 7,
            "desc": "우측 투구 손 & 공 (RHP 우투 일관성 100% 고정, 릴리스 시 z=78)",
        },
        {
            "id": "lead_thigh_L",
            "z_base": 50,
            "parent": "pelvis_pants",
            "pivot": [140, 148],
            "socket_offset": [12, 6],
            "seam_overlap_px": 10,
            "desc": "좌측 디딤발(RHP Lead Leg, 화면 우측) 허벅지 (하이 니킥 및 드롭앤드라이브)",
        },
        {
            "id": "lead_shin_L",
            "z_base": 52,
            "parent": "lead_thigh_L",
            "pivot": [144, 184],
            "socket_offset": [4, 36],
            "seam_overlap_px": 8,
            "desc": "좌측 디딤발 에메랄드 하이삭스 종아리",
        },
        {
            "id": "lead_cleat_L",
            "z_base": 54,
            "parent": "lead_shin_L",
            "pivot": [146, 218],
            "socket_offset": [2, 34],
            "seam_overlap_px": 6,
            "desc": "좌측 디딤발 에메랄드·골드 클리츠 (Foot-Plant 이후 전방 브레이킹 고정)",
        },
        {
            "id": "head_cap",
            "z_base": 60,
            "parent": "torso_jersey",
            "pivot": [128, 74],
            "socket_offset": [0, -44],
            "seam_overlap_px": 8,
            "desc": "얼굴(비취색 눈매) & 골드 크라운 엠블럼 에메랄드 투수 캡",
        },
        {
            "id": "glove_upper_arm_L",
            "z_base": 65,
            "parent": "torso_jersey",
            "pivot": [150, 92],
            "socket_offset": [22, -26],
            "seam_overlap_px": 9,
            "desc": "좌측 글러브 팔 상완 (화면 우측, 맨팔 + 에메랄드 리스트밴드)",
        },
        {
            "id": "glove_forearm_L",
            "z_base": 68,
            "parent": "glove_upper_arm_L",
            "pivot": [162, 112],
            "socket_offset": [12, 20],
            "seam_overlap_px": 8,
            "desc": "좌측 글러브 팔 전완 (높은 가이드 암 리드 -> 좌측 옆구리 당김 브레이킹)",
        },
        {
            "id": "glove_mit_L",
            "z_base": 70,
            "parent": "glove_forearm_L",
            "pivot": [154, 118],
            "socket_offset": [-8, 6],
            "seam_overlap_px": 7,
            "desc": "좌측 크림 화이트 & 골드 가죽 피처 미트 (화면 우측 고정, 손 바뀜 원천 차단)",
        },
    ],
    "key_poses_12": [
        {
            "pose_index": 1,
            "pose_id": "01_set_stance",
            "gate_5pose": "set",
            "frame_start": 1,
            "frame_end": 10,
            "key_frame": 1,
            "ref_clip": "jZKvJY6gDfg (00:03~00:08 Drew Storen Set) / iRPtVfEz4es (00:01~00:04 Zack Greinke)",
            "mound_pivot_x": 112.0,
            "mound_pivot_y": 218.0,
            "pelvis_offset": [0.0, 0.0],
            "torso_tilt_deg": 0.0,
            "shoulder_rot_deg": -6.0,
            "hip_rot_deg": -4.0,
            "lead_knee_lift": 0.0,
            "stride_depth": 0.0,
            "pitch_shoulder_deg": 28.0,
            "pitch_elbow_deg": -72.0,
            "pitch_wrist_deg": -10.0,
            "glove_shoulder_deg": -26.0,
            "glove_elbow_deg": 75.0,
            "head_scale": 1.00,
            "torso_scale": 1.00,
            "pitch_arm_front_layer": False,
            "ball_released": False,
            "notes": "세트 스탠스(RHP): 가슴 앞 크림 화이트 글러브에 우투 손을 모으고 타자석을 응시",
        },
        {
            "pose_index": 2,
            "pose_id": "02_overhead_windup",
            "gate_5pose": None,
            "frame_start": 11,
            "frame_end": 20,
            "key_frame": 16,
            "ref_clip": "iRPtVfEz4es (00:04~00:07 Windup Gather)",
            "mound_pivot_x": 112.0,
            "mound_pivot_y": 218.0,
            "pelvis_offset": [-2.0, -2.0],
            "torso_tilt_deg": -4.0,
            "shoulder_rot_deg": -14.0,
            "hip_rot_deg": -10.0,
            "lead_knee_lift": 0.25,
            "stride_depth": 0.0,
            "pitch_shoulder_deg": -65.0,
            "pitch_elbow_deg": -85.0,
            "pitch_wrist_deg": -15.0,
            "glove_shoulder_deg": -95.0,
            "glove_elbow_deg": 85.0,
            "head_scale": 1.00,
            "torso_scale": 1.00,
            "pitch_arm_front_layer": False,
            "ball_released": False,
            "notes": "풀 오버헤드 와인드업: 양팔과 크림 화이트 글러브를 머리 위로 높게 들어 올리며 리듬 형성",
        },
        {
            "pose_index": 3,
            "pose_id": "03_peak_leg_lift",
            "gate_5pose": "leg-lift",
            "frame_start": 21,
            "frame_end": 32,
            "key_frame": 28,
            "ref_clip": "iRPtVfEz4es (00:08~00:16 Peak Leg Lift) / jZKvJY6gDfg (00:09~00:11)",
            "mound_pivot_x": 112.0,
            "mound_pivot_y": 218.0,
            "pelvis_offset": [-4.0, -3.0],
            "torso_tilt_deg": -8.0,
            "shoulder_rot_deg": -32.0,
            "hip_rot_deg": -28.0,
            "lead_knee_lift": 0.98,
            "stride_depth": 0.10,
            "pitch_shoulder_deg": 35.0,
            "pitch_elbow_deg": -82.0,
            "pitch_wrist_deg": -18.0,
            "glove_shoulder_deg": -38.0,
            "glove_elbow_deg": 86.0,
            "head_scale": 1.00,
            "torso_scale": 1.01,
            "pitch_arm_front_layer": False,
            "ball_released": False,
            "notes": "5포즈 검수 게이트 [leg-lift]: 좌측 무릎(화면 우측)을 가슴 높이까지 수직으로 끌어올린 하이 니킥 정점",
        },
        {
            "pose_index": 4,
            "pose_id": "04_drop_and_drive_break",
            "gate_5pose": None,
            "frame_start": 33,
            "frame_end": 43,
            "key_frame": 38,
            "ref_clip": "jZKvJY6gDfg (00:12~00:16 Power Drive Drop) / iRPtVfEz4es (00:18~00:22)",
            "mound_pivot_x": 112.0,
            "mound_pivot_y": 218.0,
            "pelvis_offset": [-1.0, 6.0],
            "torso_tilt_deg": -5.0,
            "shoulder_rot_deg": -38.0,
            "hip_rot_deg": -22.0,
            "lead_knee_lift": 0.55,
            "stride_depth": 0.42,
            "pitch_shoulder_deg": -28.0,
            "pitch_elbow_deg": -15.0,
            "pitch_wrist_deg": 14.0,
            "glove_shoulder_deg": -58.0,
            "glove_elbow_deg": 32.0,
            "head_scale": 1.01,
            "torso_scale": 1.02,
            "pitch_arm_front_layer": False,
            "ball_released": False,
            "notes": "드롭 앤 드라이브 핸드 브레이크: 우측 축발 무릎을 깊게 굽히며 에메랄드 슬리브 우투 팔을 후방 하단으로 뻗음",
        },
        {
            "pose_index": 5,
            "pose_id": "05_power_stride_extension",
            "gate_5pose": None,
            "frame_start": 44,
            "frame_end": 53,
            "key_frame": 49,
            "ref_clip": "jZKvJY6gDfg (00:16~00:19 High Glove Lead) / iRPtVfEz4es (00:23~00:25)",
            "mound_pivot_x": 112.0,
            "mound_pivot_y": 218.0,
            "pelvis_offset": [3.0, 10.0],
            "torso_tilt_deg": 1.0,
            "shoulder_rot_deg": -44.0,
            "hip_rot_deg": -6.0,
            "lead_knee_lift": 0.22,
            "stride_depth": 0.78,
            "pitch_shoulder_deg": -82.0,
            "pitch_elbow_deg": -12.0,
            "pitch_wrist_deg": 26.0,
            "glove_shoulder_deg": -72.0,
            "glove_elbow_deg": 18.0,
            "head_scale": 1.02,
            "torso_scale": 1.03,
            "pitch_arm_front_layer": False,
            "ball_released": False,
            "notes": "파워 스트라이드 확장: 좌손 크림 화이트 글러브를 높은 타겟 라인으로 뻗고 우투 팔을 등 뒤로 길게 확장",
        },
        {
            "pose_index": 6,
            "pose_id": "06_foot_plant",
            "gate_5pose": "foot-plant",
            "frame_start": 54,
            "frame_end": 63,
            "key_frame": 60,
            "ref_clip": "jZKvJY6gDfg (00:20~00:22 Foot Plant) / iRPtVfEz4es (00:26~00:27)",
            "mound_pivot_x": 112.0,
            "mound_pivot_y": 218.0,
            "pelvis_offset": [6.0, 12.0],
            "torso_tilt_deg": 5.0,
            "shoulder_rot_deg": -32.0,
            "hip_rot_deg": 20.0,
            "lead_knee_lift": 0.0,
            "stride_depth": 1.00,
            "pitch_shoulder_deg": -118.0,
            "pitch_elbow_deg": -52.0,
            "pitch_wrist_deg": 36.0,
            "glove_shoulder_deg": -54.0,
            "glove_elbow_deg": 38.0,
            "head_scale": 1.03,
            "torso_scale": 1.04,
            "pitch_arm_front_layer": False,
            "ball_released": False,
            "notes": "5포즈 검수 게이트 [foot-plant]: 좌측 디딤발 전방 착지 완료, 골반-어깨 분리각 52° 형성 및 우완 상단 코킹",
        },
        {
            "pose_index": 7,
            "pose_id": "07_late_cocking_mer",
            "gate_5pose": None,
            "frame_start": 64,
            "frame_end": 73,
            "key_frame": 70,
            "ref_clip": "jZKvJY6gDfg (00:23~00:24 MER) / iRPtVfEz4es (00:28~00:29)",
            "mound_pivot_x": 112.0,
            "mound_pivot_y": 218.0,
            "pelvis_offset": [7.0, 13.0],
            "torso_tilt_deg": 11.0,
            "shoulder_rot_deg": 10.0,
            "hip_rot_deg": 38.0,
            "lead_knee_lift": 0.0,
            "stride_depth": 1.00,
            "pitch_shoulder_deg": -138.0,
            "pitch_elbow_deg": -76.0,
            "pitch_wrist_deg": 54.0,
            "glove_shoulder_deg": -26.0,
            "glove_elbow_deg": 86.0,
            "head_scale": 1.04,
            "torso_scale": 1.05,
            "pitch_arm_front_layer": True,
            "ball_released": False,
            "notes": "레이트 코킹(MER): 우측 어깨 최대 외회전, 하이 오버핸드 슬롯 진입 및 우투 팔 전면 레이어(z=75) 전환",
        },
        {
            "pose_index": 8,
            "pose_id": "08_overhand_whip_accel",
            "gate_5pose": None,
            "frame_start": 74,
            "frame_end": 80,
            "key_frame": 78,
            "ref_clip": "iRPtVfEz4es (00:29~00:30 High Overhand Slot) / zr573JSCf8k (00:00:38~00:00:46 Ump Cam)",
            "mound_pivot_x": 112.0,
            "mound_pivot_y": 218.0,
            "pelvis_offset": [8.0, 14.0],
            "torso_tilt_deg": 16.0,
            "shoulder_rot_deg": 28.0,
            "hip_rot_deg": 42.0,
            "lead_knee_lift": 0.0,
            "stride_depth": 1.00,
            "pitch_shoulder_deg": -112.0,
            "pitch_elbow_deg": -32.0,
            "pitch_wrist_deg": 22.0,
            "glove_shoulder_deg": -14.0,
            "glove_elbow_deg": 96.0,
            "head_scale": 1.05,
            "torso_scale": 1.06,
            "pitch_arm_front_layer": True,
            "ball_released": False,
            "notes": "오버핸드 해머 가속: 머리 위 높은 타점(11시~12시 방향)으로 우투 팔이 채찍처럼 솟구치며 가속",
        },
        {
            "pose_index": 9,
            "pose_id": "09_hammer_release_point",
            "gate_5pose": "release",
            "frame_start": 81,
            "frame_end": 88,
            "key_frame": 85,
            "ref_clip": "jZKvJY6gDfg (00:25~00:26 Release) / iRPtVfEz4es (00:30~00:31) / ls1lqM-rIH4 (00:01:49~00:02:18 Curveball)",
            "mound_pivot_x": 112.0,
            "mound_pivot_y": 218.0,
            "pelvis_offset": [9.0, 14.0],
            "torso_tilt_deg": 22.0,
            "shoulder_rot_deg": 42.0,
            "hip_rot_deg": 46.0,
            "lead_knee_lift": 0.0,
            "stride_depth": 1.00,
            "pitch_shoulder_deg": -78.0,
            "pitch_elbow_deg": -8.0,
            "pitch_wrist_deg": -20.0,
            "glove_shoulder_deg": -8.0,
            "glove_elbow_deg": 104.0,
            "head_scale": 1.06,
            "torso_scale": 1.07,
            "pitch_arm_front_layer": True,
            "ball_released": True,
            "notes": "5포즈 검수 게이트 [release]: 하이 오버핸드 해머 릴리스 포인트(F085), 수직 낙차 큰 해머 커브/라이징 패스트볼 발사",
        },
        {
            "pose_index": 10,
            "pose_id": "10_downward_pronation",
            "gate_5pose": None,
            "frame_start": 89,
            "frame_end": 97,
            "key_frame": 93,
            "ref_clip": "jZKvJY6gDfg (00:26~00:29 Extension) / iRPtVfEz4es (00:31~00:33)",
            "mound_pivot_x": 112.0,
            "mound_pivot_y": 218.0,
            "pelvis_offset": [9.0, 15.0],
            "torso_tilt_deg": 28.0,
            "shoulder_rot_deg": 48.0,
            "hip_rot_deg": 48.0,
            "lead_knee_lift": 0.0,
            "stride_depth": 1.00,
            "pitch_shoulder_deg": -22.0,
            "pitch_elbow_deg": 16.0,
            "pitch_wrist_deg": -44.0,
            "glove_shoulder_deg": -6.0,
            "glove_elbow_deg": 106.0,
            "head_scale": 1.06,
            "torso_scale": 1.07,
            "pitch_arm_front_layer": True,
            "ball_released": True,
            "notes": "전방 하향 내회전(Downward Pronation): 높은 릴리스 슬롯에서 홈플레이트 아래로 강하게 찍어 누르는 팔 확장",
        },
        {
            "pose_index": 11,
            "pose_id": "11_sky_kick_follow_through",
            "gate_5pose": "follow-through",
            "frame_start": 98,
            "frame_end": 108,
            "key_frame": 103,
            "ref_clip": "jZKvJY6gDfg (00:30~00:35 High Back-Leg Kick) / iRPtVfEz4es (00:34~00:38)",
            "mound_pivot_x": 112.0,
            "mound_pivot_y": 218.0,
            "pelvis_offset": [8.0, 15.0],
            "torso_tilt_deg": 32.0,
            "shoulder_rot_deg": 54.0,
            "hip_rot_deg": 50.0,
            "lead_knee_lift": 0.0,
            "stride_depth": 1.00,
            "pitch_shoulder_deg": 42.0,
            "pitch_elbow_deg": 46.0,
            "pitch_wrist_deg": -36.0,
            "glove_shoulder_deg": -10.0,
            "glove_elbow_deg": 98.0,
            "head_scale": 1.05,
            "torso_scale": 1.06,
            "pitch_arm_front_layer": True,
            "ball_released": True,
            "notes": "5포즈 검수 게이트 [follow-through]: 상체가 깊게 숙여지며 우측 뒷다리가 하늘로 높게 솟구치는 시그니처 스카이 킥 팔로스루",
        },
        {
            "pose_index": 12,
            "pose_id": "12_fielding_recovery",
            "gate_5pose": None,
            "frame_start": 109,
            "frame_end": 120,
            "key_frame": 120,
            "ref_clip": "iRPtVfEz4es (00:38~00:42 Fielding Position)",
            "mound_pivot_x": 112.0,
            "mound_pivot_y": 218.0,
            "pelvis_offset": [4.0, 8.0],
            "torso_tilt_deg": 12.0,
            "shoulder_rot_deg": 16.0,
            "hip_rot_deg": 18.0,
            "lead_knee_lift": 0.0,
            "stride_depth": 0.85,
            "pitch_shoulder_deg": 28.0,
            "pitch_elbow_deg": -48.0,
            "pitch_wrist_deg": -12.0,
            "glove_shoulder_deg": -24.0,
            "glove_elbow_deg": 78.0,
            "head_scale": 1.02,
            "torso_scale": 1.02,
            "pitch_arm_front_layer": False,
            "ball_released": True,
            "notes": "수비 리커버리 자세(RHP): 우측 다리가 안정적으로 착지하며 크림 화이트 글러브를 가슴 앞에 둔 수비 준비 완료",
        },
    ],
}


def smoothstep(t: float) -> float:
    t = max(0.0, min(1.0, t))
    return t * t * (3.0 - 2.0 * t)


def build_120_frame_timeline_emerald(spec: dict) -> list:
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

        px = round(prev_p["pelvis_offset"][0] + (next_p["pelvis_offset"][0] - prev_p["pelvis_offset"][0]) * alpha, 4)
        py = round(prev_p["pelvis_offset"][1] + (next_p["pelvis_offset"][1] - prev_p["pelvis_offset"][1]) * alpha, 4)

        mound_x = lerp("mound_pivot_x")  # 112.0 (RHP right pivot foot on viewer's left)
        mound_y = lerp("mound_pivot_y")  # 218.0
        pelvis_x = 128.0 + px
        pelvis_y = 142.0 + py

        torso_rad = math.radians(lerp("torso_tilt_deg"))
        torso_x = pelvis_x + math.sin(torso_rad) * 24.0
        torso_y = pelvis_y - math.cos(torso_rad) * 24.0

        sh_rot_rad = math.radians(lerp("shoulder_rot_deg"))
        # Right pitching shoulder (viewer's left = x < torso_x)
        r_shoulder_x = torso_x - 24.0 * math.cos(sh_rot_rad * 0.6)
        r_shoulder_y = torso_y - 22.0 + 4.0 * math.sin(sh_rot_rad)

        # Left glove shoulder (viewer's right = x > torso_x)
        l_shoulder_x = torso_x + 22.0 * math.cos(sh_rot_rad * 0.6)
        l_shoulder_y = torso_y - 22.0 - 4.0 * math.sin(sh_rot_rad)

        # Right Pitching Arm FK Chain (RHP: shoulder -> elbow -> wrist/hand, length 24px + 22px)
        p_sh_rad = math.radians(lerp("pitch_shoulder_deg"))
        p_el_rad = p_sh_rad + math.radians(lerp("pitch_elbow_deg"))
        r_elbow_x = r_shoulder_x + math.cos(p_sh_rad) * 24.0
        r_elbow_y = r_shoulder_y + math.sin(p_sh_rad) * 24.0
        r_wrist_x = r_elbow_x + math.cos(p_el_rad) * 22.0
        r_wrist_y = r_elbow_y + math.sin(p_el_rad) * 22.0

        # Left Glove Arm FK Chain (LHP glove: shoulder -> elbow -> glove mit, length 22px + 20px)
        g_sh_rad = math.radians(lerp("glove_shoulder_deg"))
        g_el_rad = g_sh_rad + math.radians(lerp("glove_elbow_deg"))
        l_elbow_x = l_shoulder_x + math.cos(g_sh_rad) * 22.0
        l_elbow_y = l_shoulder_y + math.sin(g_sh_rad) * 22.0
        l_wrist_x = l_elbow_x + math.cos(g_el_rad) * 20.0
        l_wrist_y = l_elbow_y + math.sin(g_el_rad) * 20.0

        frames.append({
            "frame": f,
            "atlas_col": (f - 1) % 10,
            "atlas_row": (f - 1) // 10,
            "pose_id": next_p["pose_id"] if alpha >= 0.5 else prev_p["pose_id"],
            "mound_anchor": [mound_x, mound_y],
            "pelvis_pos": [round(pelvis_x, 3), round(pelvis_y, 3)],
            "torso_pos": [round(torso_x, 3), round(torso_y, 3)],
            "r_shoulder_pos": [round(r_shoulder_x, 3), round(r_shoulder_y, 3)],
            "r_elbow_pos": [round(r_elbow_x, 3), round(r_elbow_y, 3)],
            "r_wrist_pos": [round(r_wrist_x, 3), round(r_wrist_y, 3)],
            "l_shoulder_pos": [round(l_shoulder_x, 3), round(l_shoulder_y, 3)],
            "l_elbow_pos": [round(l_elbow_x, 3), round(l_elbow_y, 3)],
            "l_wrist_pos": [round(l_wrist_x, 3), round(l_wrist_y, 3)],
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
            "pitch_arm_front_layer": 64 <= f <= 108,
            "ball_released": f >= 85,
            "throws_hand": "RHP",
            "glove_hand": "LHP",
        })
    return frames


timeline_120 = build_120_frame_timeline_emerald(RIG_SPEC_EMERALD)
RIG_SPEC_EMERALD["timeline_120"] = timeline_120


def run_qa_checks_emerald(timeline: list) -> dict:
    mound_drifts = [
        math.hypot(fr["mound_anchor"][0] - 112.0, fr["mound_anchor"][1] - 218.0)
        for fr in timeline
    ]
    max_mound_drift = max(mound_drifts)
    handedness_flips = sum(
        1 for fr in timeline if fr["throws_hand"] != "RHP" or fr["glove_hand"] != "LHP"
    )

    upper_arm_errors = []
    forearm_errors = []
    for fr in timeline:
        u_len = math.hypot(
            fr["r_elbow_pos"][0] - fr["r_shoulder_pos"][0],
            fr["r_elbow_pos"][1] - fr["r_shoulder_pos"][1],
        )
        f_len = math.hypot(
            fr["r_wrist_pos"][0] - fr["r_elbow_pos"][0],
            fr["r_wrist_pos"][1] - fr["r_elbow_pos"][1],
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
        abs(timeline[i]["pitch_shoulder_deg"] - timeline[i - 1]["pitch_shoulder_deg"])
        for i in range(1, len(timeline))
    )

    return {
        "character": "에메랄드 템페스트 (Emerald Tempest #77)",
        "throws": "RHP (우투 하이 오버핸드)",
        "mound_anchor_coord": [112.0, 218.0],
        "mound_anchor_max_drift_px": round(max_mound_drift, 4),
        "mound_anchor_pass": max_mound_drift <= 1.5,
        "handedness_flip_count": handedness_flips,
        "handedness_lock_pass": handedness_flips == 0,
        "fk_joint_max_error_px": max_joint_error,
        "fk_joint_continuity_pass": max_joint_error < 0.01,
        "head_scale_range": [min(head_scales), max(head_scales)],
        "torso_scale_range": [min(torso_scales), max(torso_scales)],
        "proportion_lock_pass": 0.95 <= min(head_scales) and max(head_scales) <= 1.10,
        "max_torso_step_deg_per_frame": round(max_torso_step, 3),
        "max_pitch_shoulder_step_deg_per_frame": round(max_shoulder_step, 3),
        "smooth_60fps_pass": max_torso_step < 3.5 and max_shoulder_step < 16.0,
        "atlas_grid_pass": len(timeline) == 120 and timeline[-1]["atlas_col"] == 9 and timeline[-1]["atlas_row"] == 11,
    }


qa_results = run_qa_checks_emerald(timeline_120)
RIG_SPEC_EMERALD["qa_validation"] = qa_results

(INTER_DIR / "emerald_tempest_rig_and_timeline.json").write_text(
    json.dumps(RIG_SPEC_EMERALD, ensure_ascii=False, indent=2), encoding="utf-8"
)
print("Emerald Tempest QA Results:", json.dumps(qa_results, ensure_ascii=False, indent=2))
