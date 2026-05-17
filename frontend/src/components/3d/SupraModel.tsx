"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import {
  Vector3,
  Box3,
  Mesh,
  MeshStandardMaterial,
  MeshPhysicalMaterial,
  Object3D,
  Color,
  BoxGeometry,
  CylinderGeometry,
  SphereGeometry,
  TorusGeometry,
  Raycaster,
} from "three";
import type { Group } from "three";
import { useFrame, ThreeEvent } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";

/* ================================================================
   UTILITIES
   ================================================================ */

function getHealthColor(h: number): string {
  if (h >= 90) return "#86EFAC";
  if (h >= 70) return "#5EEAD4";
  if (h >= 50) return "#FCD34D";
  if (h >= 30) return "#5EEAD4";
  return "#FCA5A5";
}

type PartZone = "exterior" | "interior" | "wheel";

interface PartDef {
  label: string;
  health: number;
  zone: PartZone;
  explodeDir: [number, number, number]; // direction to explode
}

/* ================================================================
   PART DEFINITIONS — every selectable part with health & zone
   ================================================================ */

const partDefs: Record<string, PartDef> = {
  // ─── Exterior Body ───
  "Ext.Body_Shell":             { label: "Body Shell (Veilside A80)",  health: 93, zone: "exterior", explodeDir: [0, 0, 0] },
  "Ext.Front_Bumper":           { label: "Veilside Front Bumper",      health: 91, zone: "exterior", explodeDir: [0, 0, 2.0] },
  "Ext.Front_Lip":              { label: "Veilside Front Lip",         health: 88, zone: "exterior", explodeDir: [0, -0.4, 1.5] },
  "Ext.Side_Skirts":            { label: "Veilside Side Skirts",       health: 90, zone: "exterior", explodeDir: [1.8, -0.3, 0] },
  "Ext.Rear_Diffuser":          { label: "Veilside Rear Diffuser",     health: 85, zone: "exterior", explodeDir: [0, -0.3, -1.8] },
  "Ext.Rear_Wing_Upper":        { label: "Rear Wing (Upper)",          health: 94, zone: "exterior", explodeDir: [0, 1.5, -1.2] },
  "Ext.Rear_Wing_Lower":        { label: "Rear Wing (Lower Mount)",    health: 96, zone: "exterior", explodeDir: [0, 1.2, -1.0] },
  "Ext.Mirror_Housing":         { label: "Side Mirror Housing",        health: 96, zone: "exterior", explodeDir: [2.0, 0.5, 0] },
  "Ext.Mirror_Glass":           { label: "Side Mirror Glass",          health: 98, zone: "exterior", explodeDir: [2.2, 0.5, 0] },
  "Ext.Black_Trim":             { label: "Black Exterior Trim",        health: 92, zone: "exterior", explodeDir: [0, 0.3, 0] },

  // ─── Exterior Glass ───
  "Ext.Windshield":             { label: "Windshield",                 health: 100, zone: "exterior", explodeDir: [0, 1.5, 0.8] },
  "Ext.Side_Windows":           { label: "Side Windows (Tinted)",      health: 98,  zone: "exterior", explodeDir: [0, 1.0, 0] },
  "Ext.Rear_Glass":             { label: "Rear Window Glass",          health: 99,  zone: "exterior", explodeDir: [0, 1.2, -0.5] },
  "Ext.Window_Trim":            { label: "Window Dots / Trim",         health: 97,  zone: "exterior", explodeDir: [0, 0.5, 0] },

  // ─── Exterior Lights ───
  "Ext.Headlight_Housing":      { label: "Headlight Housing",          health: 97, zone: "exterior", explodeDir: [0, 0.3, 1.2] },
  "Ext.Headlight_Inner":        { label: "Headlight Inner Reflector",  health: 99, zone: "exterior", explodeDir: [0, 0.3, 1.4] },
  "Ext.Headlight_Lens":         { label: "Headlight Lens",             health: 97, zone: "exterior", explodeDir: [0, 0.4, 1.5] },
  "Ext.Headlight_Bulb":         { label: "Headlight Bulb",             health: 95, zone: "exterior", explodeDir: [0, 0.5, 1.6] },
  "Ext.Taillight_Brake":        { label: "Brake Light Glass",          health: 96, zone: "exterior", explodeDir: [0, 0.3, -1.5] },
  "Ext.Taillight_Reflector":    { label: "Tail Reflector",             health: 98, zone: "exterior", explodeDir: [0, 0.3, -1.6] },
  "Ext.Taillight_Reverse":      { label: "Reverse Light",              health: 97, zone: "exterior", explodeDir: [0, 0.3, -1.4] },
  "Ext.Taillight_Turn":         { label: "Rear Turn Signal",           health: 98, zone: "exterior", explodeDir: [0, 0.4, -1.5] },
  "Ext.Center_Brake_Light":     { label: "Center Brake Light",         health: 96, zone: "exterior", explodeDir: [0, 0.6, -1.3] },
  "Ext.Front_Turn_Signal":      { label: "Front Turn Signal Glass",    health: 98, zone: "exterior", explodeDir: [0, 0.3, 1.0] },
  "Ext.Turn_Signal_Bulb":       { label: "Turn Signal Bulb (Orange)",  health: 95, zone: "exterior", explodeDir: [0, 0.5, 0.8] },

  // ─── Exterior Detail ───
  "Ext.Radiator":               { label: "Radiator",                   health: 70, zone: "exterior", explodeDir: [0, 0, 2.0] },
  "Ext.Radiator_Frame":         { label: "Radiator Frame (Metal)",     health: 82, zone: "exterior", explodeDir: [0, 0, 1.8] },
  "Ext.Wiper_Area":             { label: "Wiper Cowl Area",            health: 88, zone: "exterior", explodeDir: [0, 0.8, 0.3] },
  "Ext.License_Plate":          { label: "Rear License Plate",         health: 95, zone: "exterior", explodeDir: [0, 0, -1.5] },
  "Ext.Chrome_Trim":            { label: "Chrome Exterior Trim",       health: 90, zone: "exterior", explodeDir: [0, 0.3, 0] },
  "Ext.Plastic_Trim":           { label: "Plastic Exterior Trim",      health: 88, zone: "exterior", explodeDir: [0, 0.2, 0] },
  "Ext.Door_Locks":             { label: "Door Locks / Handles",       health: 94, zone: "exterior", explodeDir: [1.5, 0, 0] },
  "Ext.Emblem_Red":             { label: "Red Emblem",                 health: 97, zone: "exterior", explodeDir: [0, 0.3, -1.0] },
  "Ext.Emblem_Orange":          { label: "Orange Emblem",              health: 97, zone: "exterior", explodeDir: [0, 0.3, -1.0] },
  "Ext.Rearview_Mirror":        { label: "Interior Rearview Mirror",   health: 100, zone: "exterior", explodeDir: [0, 0.8, 0.3] },
  "Ext.Tail_Red_Accent":        { label: "Tail Red Accent",            health: 92, zone: "exterior", explodeDir: [0, 0.2, -1.2] },

  // ─── Wheels (per-corner, per-component) ───
  "Wheels.Tyre_FL":   { label: "Tyre — Front Left",           health: 80, zone: "wheel", explodeDir: [-2.0, 0, 1.2] },
  "Wheels.Rim_FL":    { label: "WEDS Rim — Front Left",       health: 92, zone: "wheel", explodeDir: [-2.2, 0, 1.2] },
  "Wheels.Caliper_FL":{ label: "Brake Caliper — Front Left",  health: 88, zone: "wheel", explodeDir: [-2.4, 0, 1.2] },
  "Wheels.Disc_FL":   { label: "Brake Disc — Front Left",     health: 72, zone: "wheel", explodeDir: [-2.6, 0, 1.2] },
  "Wheels.Tyre_FR":   { label: "Tyre — Front Right",          health: 82, zone: "wheel", explodeDir: [2.0, 0, 1.2] },
  "Wheels.Rim_FR":    { label: "WEDS Rim — Front Right",      health: 94, zone: "wheel", explodeDir: [2.2, 0, 1.2] },
  "Wheels.Caliper_FR":{ label: "Brake Caliper — Front Right",  health: 90, zone: "wheel", explodeDir: [2.4, 0, 1.2] },
  "Wheels.Disc_FR":   { label: "Brake Disc — Front Right",    health: 74, zone: "wheel", explodeDir: [2.6, 0, 1.2] },
  "Wheels.Tyre_RL":   { label: "Tyre — Rear Left",            health: 84, zone: "wheel", explodeDir: [-2.0, 0, -1.2] },
  "Wheels.Rim_RL":    { label: "WEDS Rim — Rear Left",        health: 93, zone: "wheel", explodeDir: [-2.2, 0, -1.2] },
  "Wheels.Caliper_RL":{ label: "Brake Caliper — Rear Left",   health: 89, zone: "wheel", explodeDir: [-2.4, 0, -1.2] },
  "Wheels.Disc_RL":   { label: "Brake Disc — Rear Left",      health: 76, zone: "wheel", explodeDir: [-2.6, 0, -1.2] },
  "Wheels.Tyre_RR":   { label: "Tyre — Rear Right",           health: 78, zone: "wheel", explodeDir: [2.0, 0, -1.2] },
  "Wheels.Rim_RR":    { label: "WEDS Rim — Rear Right",       health: 91, zone: "wheel", explodeDir: [2.2, 0, -1.2] },
  "Wheels.Caliper_RR":{ label: "Brake Caliper — Rear Right",  health: 87, zone: "wheel", explodeDir: [2.4, 0, -1.2] },
  "Wheels.Disc_RR":   { label: "Brake Disc — Rear Right",     health: 70, zone: "wheel", explodeDir: [2.6, 0, -1.2] },

  // ─── Interior ───
  "Int.Dashboard":        { label: "Dashboard Assembly",          health: 95, zone: "interior", explodeDir: [0, 1.0, 0.5] },
  "Int.Dashboard_Symbols":{ label: "Dashboard Symbols / Display", health: 97, zone: "interior", explodeDir: [0, 1.2, 0.5] },
  "Int.Center_Console":   { label: "Center Console & Buttons",    health: 96, zone: "interior", explodeDir: [0, 0.8, 0] },
  "Int.Recaro_Seats":     { label: "Recaro Bucket Seats",         health: 92, zone: "interior", explodeDir: [0, 1.5, 0] },
  "Int.Steering_Wheel":   { label: "Steering Wheel Assembly",     health: 98, zone: "interior", explodeDir: [0, 1.8, 0.8] },
  "Int.Speedometer":      { label: "Speedometer Gauge",           health: 95, zone: "interior", explodeDir: [0.3, 2.0, 0.5] },
  "Int.Tachometer":       { label: "Tachometer (RPM) Gauge",      health: 93, zone: "interior", explodeDir: [-0.3, 2.0, 0.5] },
  "Int.Boost_Gauge":      { label: "Turbo Boost Gauge",           health: 90, zone: "interior", explodeDir: [0, 2.2, 0.5] },
  "Int.Fuel_Gauge":       { label: "Fuel Level Gauge",            health: 96, zone: "interior", explodeDir: [-0.5, 2.0, 0.5] },
  "Int.Water_Temp_Gauge": { label: "Water Temperature Gauge",     health: 92, zone: "interior", explodeDir: [0.5, 2.0, 0.5] },
  "Int.Clock":            { label: "Dashboard Clock",             health: 99, zone: "interior", explodeDir: [0, 2.3, 0.4] },
  "Int.Carpet_Floor":     { label: "Carpet & Floor Panels",       health: 88, zone: "interior", explodeDir: [0, -0.5, 0] },
  "Int.Seatbelts":        { label: "Seatbelt Assembly",           health: 94, zone: "interior", explodeDir: [0, 1.0, -0.3] },
  "Int.Chrome_Accents":   { label: "Interior Chrome Accents",     health: 97, zone: "interior", explodeDir: [0, 0.5, 0] },
  "Int.Speakers":         { label: "Speaker Grilles",             health: 90, zone: "interior", explodeDir: [1.0, 0.5, 0] },
  "Int.Dome_Light":       { label: "Dome / Cabin Light",          health: 99, zone: "interior", explodeDir: [0, 1.5, 0] },
  "Int.Dash_Lights":      { label: "Dashboard Indicator Lights",  health: 94, zone: "interior", explodeDir: [0, 1.3, 0.6] },
  "Int.Gear_Shifter":     { label: "Gear Shifter Assembly",       health: 93, zone: "interior", explodeDir: [0, 1.0, -0.2] },
  "Int.Interior_Glass":   { label: "Interior Glass Panels",       health: 100, zone: "interior", explodeDir: [0, 0.5, 0] },
  "Int.Red_Accents":      { label: "Red Interior Accents",        health: 95, zone: "interior", explodeDir: [0, 0.3, 0] },
  "Int.Stitching":        { label: "Leather Stitching Detail",    health: 97, zone: "interior", explodeDir: [0, 0.2, 0] },
  "Int.Seat_Leather":     { label: "Seat Leather Panels",         health: 91, zone: "interior", explodeDir: [0, 1.3, 0] },
  "Int.Rough_Plastic":    { label: "Dashboard Rough Plastic",     health: 93, zone: "interior", explodeDir: [0, 0.8, 0.3] },
  "Int.Smooth_Plastic":   { label: "Interior Smooth Plastic",     health: 95, zone: "interior", explodeDir: [0, 0.6, 0] },
  "Int.Clutch_Pedal":     { label: "Clutch Pedal Rest",           health: 90, zone: "interior", explodeDir: [0, -0.3, 0.5] },
  "Int.Hazard_Button":    { label: "Hazard Warning Button",       health: 99, zone: "interior", explodeDir: [0, 1.0, 0.3] },
  "Int.Odometers":        { label: "Odometer Display",            health: 96, zone: "interior", explodeDir: [0, 1.5, 0.5] },
  "Int.Window_Branding":  { label: "Window Branding Decal",       health: 100, zone: "interior", explodeDir: [0, 0.5, 0] },
  "Int.Seat_Pattern":     { label: "Seat Fabric Pattern",         health: 89, zone: "interior", explodeDir: [0, 1.2, 0] },

  // ─── Engine Bay (procedural — not in GLB) ───
  "Engine.2JZ_Block":       { label: "2JZ-GTE Engine Block",        health: 78, zone: "interior", explodeDir: [0, 2.0, 2.5] },
  "Engine.Turbo_Kit":       { label: "Twin Turbo Assembly",         health: 65, zone: "interior", explodeDir: [0.8, 2.5, 2.0] },
  "Engine.Intercooler":     { label: "Front-Mount Intercooler",     health: 72, zone: "interior", explodeDir: [0, 1.5, 3.0] },
  "Engine.Exhaust_Manifold":{ label: "Exhaust Manifold",            health: 60, zone: "interior", explodeDir: [-0.8, 2.0, 2.0] },
  "Engine.Intake_Manifold": { label: "Intake Manifold",             health: 82, zone: "interior", explodeDir: [0, 2.5, 1.5] },
  "Engine.Oil_Filter":      { label: "Oil Filter",                  health: 45, zone: "interior", explodeDir: [-0.5, 1.5, 2.5] },
  "Engine.Air_Filter":      { label: "Air Filter Housing",          health: 55, zone: "interior", explodeDir: [1.0, 2.0, 1.5] },
  "Engine.Alternator":      { label: "Alternator",                  health: 85, zone: "interior", explodeDir: [-0.8, 1.8, 1.8] },
  "Engine.Radiator_Fan":    { label: "Radiator Fan",                health: 75, zone: "interior", explodeDir: [0, 1.5, 3.2] },
  "Engine.Valve_Cover":     { label: "Valve Cover",                 health: 88, zone: "interior", explodeDir: [0, 3.0, 2.0] },
  "Engine.Transmission":    { label: "Getrag V160 6-Speed",         health: 80, zone: "interior", explodeDir: [0, 1.5, -0.5] },
  "Engine.Driveshaft":      { label: "Driveshaft",                  health: 90, zone: "interior", explodeDir: [0, 1.0, -1.5] },
  "Engine.Coolant_Hoses":   { label: "Coolant Hoses",               health: 68, zone: "interior", explodeDir: [0.5, 2.0, 2.8] },
  "Engine.Battery":         { label: "Battery",                     health: 70, zone: "interior", explodeDir: [1.2, 1.8, 1.0] },

  // ─── Chassis / Structural (procedural) ───
  "Chassis.Front_Subframe": { label: "Front Subframe",              health: 92, zone: "interior", explodeDir: [0, -0.5, 1.5] },
  "Chassis.Rear_Subframe":  { label: "Rear Subframe",               health: 94, zone: "interior", explodeDir: [0, -0.5, -1.5] },
  "Chassis.Floor_Pan":      { label: "Chassis Floor Pan",           health: 88, zone: "interior", explodeDir: [0, -1.0, 0] },
  "Chassis.Roll_Cage":      { label: "Roll Cage",                   health: 98, zone: "interior", explodeDir: [0, 2.5, 0] },
};

/* ================================================================
   NODE → PART MAPPING
   Maps GLB node base-names to part IDs.
   Node names have Sketchfab suffix like "_240" which we strip.
   ================================================================ */

const nodeToPartMap: Record<string, string> = {
  // ─── Body Shell & Veilside Kit ───
  "32_T":                  "Ext.Body_Shell",
  "VEILSIDE_FRONT":        "Ext.Front_Bumper",
  "VEILSIDE_LIP":          "Ext.Front_Lip",
  "VEILSIDE_SKIRT":        "Ext.Side_Skirts",
  "VEILSIDE_SPL":          "Ext.Rear_Diffuser",
  "VEILSIDE_WING1":        "Ext.Rear_Wing_Upper",
  "VEILSIDE_WING2":        "Ext.Rear_Wing_Lower",
  "VEILSIDE_MIRRORS_BODY": "Ext.Mirror_Housing",
  "VEILSIDE_MIRRORS_GLASS":"Ext.Mirror_Glass",
  "39":                    "Ext.Black_Trim",
  "blacksolid":            "Ext.Black_Trim",
  "22_T.001":              "Ext.Black_Trim",

  // ─── Exterior Glass ───
  "59_T.002":   "Ext.Windshield",
  "59_T":       "Ext.Side_Windows",
  "52_T":       "Ext.Rear_Glass",
  "52_T.001":   "Ext.Rear_Glass",
  "52_T.002":   "Ext.Rear_Glass",
  "47":         "Ext.Window_Trim",

  // ─── Headlights ───
  "43":         "Ext.Headlight_Housing",
  "206":        "Ext.Headlight_Housing",
  "41":         "Ext.Headlight_Inner",
  "183.001":    "Ext.Headlight_Lens",
  "inner_bulb": "Ext.Headlight_Bulb",

  // ─── Taillights ───
  "45":         "Ext.Taillight_Brake",
  "104.001":    "Ext.Taillight_Brake",
  "328":        "Ext.Taillight_Reflector",
  "104":        "Ext.Taillight_Reflector",
  "161":        "Ext.Taillight_Reverse",
  "185":        "Ext.Taillight_Reverse",
  "329":        "Ext.Taillight_Turn",
  "186_T":      "Ext.Center_Brake_Light",
  "181":        "Ext.Front_Turn_Signal",
  "168":        "Ext.Turn_Signal_Bulb",

  // ─── Exterior Detail ───
  "150":               "Ext.Radiator",
  "152":               "Ext.Radiator_Frame",
  "151":               "Ext.Tail_Red_Accent",
  "187":               "Ext.Wiper_Area",
  "188":               "Ext.Wiper_Area",
  "EXT_PLATE_R.001":   "Ext.License_Plate",
  "EXT_PLATE_R_SCREWS":"Ext.License_Plate",
  "33_T.003":          "Ext.Door_Locks",
  "158_T.004":         "Ext.Door_Locks",
  "158_T.002":         "Ext.Emblem_Red",
  "158_T.003":         "Ext.Emblem_Orange",
  "middle_mirror":     "Ext.Rearview_Mirror",

  // Chrome / plastic trim (Untitled nodes from Sketchfab export)
  "Untitled":      "Ext.Chrome_Trim",
  "Untitled.001":  "Ext.Chrome_Trim",
  "Untitled.007":  "Ext.Chrome_Trim",
  "Untitled.011":  "Ext.Chrome_Trim",
  "untitled1":     "Ext.Chrome_Trim",
  "Untitled.002":  "Ext.Plastic_Trim",
  "Untitled.003":  "Ext.Plastic_Trim",
  "Untitled.004":  "Ext.Plastic_Trim",
  "Untitled.005":  "Ext.Plastic_Trim",
  "Untitled.006":  "Ext.Plastic_Trim",

  // ─── Wheels — Front Left ───
  "TYRE_LF":  "Wheels.Tyre_FL",
  "RIM_LF":   "Wheels.Rim_FL",
  "SUSP_LF":  "Wheels.Caliper_FL",
  "DISC_LF":  "Wheels.Disc_FL",
  // WEDS sub-parts → Rim
  "WEDS_OFF_LF":   "Wheels.Rim_FL",
  "WEDS_LUG_LF":   "Wheels.Rim_FL",
  "WEDS_INNER_LF":  "Wheels.Rim_FL",
  "WEDS_CAP_LF":    "Wheels.Rim_FL",
  "WEDS_BLACK_LF":  "Wheels.Rim_FL",
  "WEDS_BASE_LF":   "Wheels.Rim_FL",

  // ─── Wheels — Front Right ───
  "TYRE_RF":  "Wheels.Tyre_FR",
  "RIM_RF":   "Wheels.Rim_FR",
  "SUSP_RF":  "Wheels.Caliper_FR",
  "DISC_RF":  "Wheels.Disc_FR",
  "WEDS_OFF_RF":   "Wheels.Rim_FR",
  "WEDS_LUG_RF":   "Wheels.Rim_FR",
  "WEDS_INNER_RF":  "Wheels.Rim_FR",
  "WEDS_CAP_RF":    "Wheels.Rim_FR",
  "WEDS_BLACK_RF":  "Wheels.Rim_FR",
  "WEDS_BASE_RF":   "Wheels.Rim_FR",

  // ─── Wheels — Rear Left ───
  "TYRE_LR":  "Wheels.Tyre_RL",
  "RIM_LR":   "Wheels.Rim_RL",
  "SUSP_LR":  "Wheels.Caliper_RL",
  "DISC_LR":  "Wheels.Disc_RL",
  "WEDS_OFF_LR":   "Wheels.Rim_RL",
  "WEDS_LUG_LR":   "Wheels.Rim_RL",
  "WEDS_INNER_LR":  "Wheels.Rim_RL",
  "WEDS_CAP_LR":    "Wheels.Rim_RL",
  "WEDS_BLACK_LR":  "Wheels.Rim_RL",
  "WEDS_BASE_LR":   "Wheels.Rim_RL",

  // ─── Wheels — Rear Right ───
  "TYRE_RR":  "Wheels.Tyre_RR",
  "RIM_RR":   "Wheels.Rim_RR",
  "SUSP_RR":  "Wheels.Caliper_RR",
  "DISC_RR":  "Wheels.Disc_RR",
  "WEDS_OFF_RR":   "Wheels.Rim_RR",
  "WEDS_LUG_RR":   "Wheels.Rim_RR",
  "WEDS_INNER_RR":  "Wheels.Rim_RR",
  "WEDS_CAP_RR":    "Wheels.Rim_RR",
  "WEDS_BLACK_RR":  "Wheels.Rim_RR",
  "WEDS_BASE_RR":   "Wheels.Rim_RR",

  // WHEEL_XX parent groups → tyre (outermost visible)
  "WHEEL_LF": "Wheels.Tyre_FL",
  "WHEEL_RF": "Wheels.Tyre_FR",
  "WHEEL_LR": "Wheels.Tyre_RL",
  "WHEEL_RR": "Wheels.Tyre_RR",

  // ─── Interior — Dashboard & Console ───
  "214.001":   "Int.Dashboard",
  "214.002":   "Int.Dashboard",
  "213":       "Int.Rough_Plastic",
  "215":       "Int.Dashboard_Symbols",
  "241":       "Int.Center_Console",
  "241.001":   "Int.Center_Console",
  "242":       "Int.Center_Console",

  // ─── Interior — Seats ───
  "240":           "Int.Recaro_Seats",
  "70_T":          "Int.Seat_Pattern",
  "Untitled.008":  "Int.Seat_Leather",

  // ─── Interior — Steering ───
  "STEER_HR":   "Int.Steering_Wheel",
  "194":        "Int.Steering_Wheel",
  "194.001":    "Int.Steering_Wheel",
  "195_T.001":  "Int.Steering_Wheel",
  "66_T":       "Int.Steering_Wheel",

  // ─── Interior — Gauges ───
  "SPEED":       "Int.Speedometer",
  "217":         "Int.Speedometer",
  "216":         "Int.Speedometer",
  "rpm":         "Int.Tachometer",
  "220":         "Int.Tachometer",
  "219":         "Int.Tachometer",
  "turbo":       "Int.Boost_Gauge",
  "229":         "Int.Boost_Gauge",
  "228":         "Int.Boost_Gauge",
  "fuel":        "Int.Fuel_Gauge",
  "226":         "Int.Fuel_Gauge",
  "225":         "Int.Fuel_Gauge",
  "water_temp":  "Int.Water_Temp_Gauge",
  "223":         "Int.Water_Temp_Gauge",
  "222":         "Int.Water_Temp_Gauge",
  "HOURS":       "Int.Clock",
  "MINS":        "Int.Clock",
  "Circle":      "Int.Clock",
  "Circle.001":  "Int.Clock",
  "Circle.002":  "Int.Clock",
  "243":         "Int.Dash_Lights",
  "244":         "Int.Odometers",

  // ─── Interior — Other ───
  "191":       "Int.Chrome_Accents",
  "210":       "Int.Chrome_Accents",
  "252":       "Int.Chrome_Accents",
  "201":       "Int.Clutch_Pedal",
  "202":       "Int.Carpet_Floor",
  "208":       "Int.Carpet_Floor",
  "212":       "Int.Interior_Glass",
  "233":       "Int.Red_Accents",
  "234":       "Int.Dome_Light",
  "235":       "Int.Stitching",
  "239":       "Int.Speakers",
  "250":       "Int.Seatbelts",
  "250.001":   "Int.Seatbelts",
  "CINTURE_ON":  "Int.Seatbelts",
  "CINTURE_OFF": "Int.Seatbelts",
  "75":          "Int.Hazard_Button",
  "248":         "Int.Gear_Shifter",
  "74":          "Int.Gear_Shifter",
  "198.002":     "Int.Gear_Shifter",
  "196.001":     "Int.Dashboard_Symbols",
  "198.003":     "Int.Steering_Wheel",
  "199.001":     "Int.Steering_Wheel",
  "74.002":      "Int.Smooth_Plastic",
  "74.001":      "Int.Smooth_Plastic",
  "59_T.001":    "Int.Window_Branding",
  "258.001":     "Int.Seatbelts",
  "260":         "Int.Seatbelts",
  "68":          "Int.Seatbelts",

  // Dash lights series (76.xxx) — all are dashboard indicator lights
  "76":       "Int.Dash_Lights",
  "76.001":   "Int.Dash_Lights",
  "76.002":   "Int.Dash_Lights",
  "76.003":   "Int.Dash_Lights",
  "76.004":   "Int.Dash_Lights",
  "76.005":   "Int.Dash_Lights",
  "76.006":   "Int.Dash_Lights",
  "76.007":   "Int.Dash_Lights",
  "76.008":   "Int.Dash_Lights",
  "76.009":   "Int.Dash_Lights",
  "76.010":   "Int.Dash_Lights",
  "76.011":   "Int.Dash_Lights",
  "76.012":   "Int.Dash_Lights",
};

/* ================================================================
   NODE NAME RESOLVER
   Strips Sketchfab's numeric suffixes and walks up the hierarchy.
   ================================================================ */

/** Strip trailing _NNN suffix added by Sketchfab export */
function stripSuffix(name: string): string {
  return name.replace(/_\d+$/, "");
}

/** Resolve a mesh → partId by walking up its ancestor chain */
function resolvePartId(obj: Object3D): string {
  let cur: Object3D | null = obj;
  while (cur) {
    if (cur.name) {
      const base = stripSuffix(cur.name);

      // Direct lookup
      if (nodeToPartMap[base]) return nodeToPartMap[base];
      if (nodeToPartMap[cur.name]) return nodeToPartMap[cur.name];

      // Dotted base: "76.003" → try "76"
      const dotBase = base.split(".")[0];
      if (dotBase !== base && nodeToPartMap[dotBase]) return nodeToPartMap[dotBase];

      // Prefix match for WEDS_*, TYRE_*, etc.
      for (const key of Object.keys(nodeToPartMap)) {
        if (base.startsWith(key + "_") || base.startsWith(key + ".")) {
          return nodeToPartMap[key];
        }
      }
    }
    cur = cur.parent;
  }
  return "Ext.Body_Shell"; // fallback
}

/* ================================================================
   VIEW-MODE HELPERS
   ================================================================ */

function isSelectable(zone: PartZone, xray: boolean, exploded: boolean): boolean {
  if (exploded) return true;                          // explode → everything
  if (xray) return zone === "interior";               // xray → interior only
  return zone === "exterior" || zone === "wheel";     // default → exterior + wheels
}

/* ================================================================
   EXPLODE TARGET GROUPS
   Named groups in the GLB hierarchy that we move for explode mode.
   ================================================================ */

const explodeGroupMap: Record<string, [number, number, number]> = {
  // Body shell & kit
  "32_T":                  [0, 1.8, 0],     // body shell lifts up
  "VEILSIDE_FRONT":        [0, 0, 2.5],
  "VEILSIDE_LIP":          [0, -0.4, 2.0],
  "VEILSIDE_SKIRT":        [2.0, -0.3, 0],
  "VEILSIDE_SPL":          [0, -0.3, -2.0],
  "VEILSIDE_WING1":        [0, 2.0, -1.5],
  "VEILSIDE_WING2":        [0, 1.5, -1.2],
  "VEILSIDE_MIRRORS_BODY": [2.5, 0.5, 0],
  "VEILSIDE_MIRRORS_GLASS":[2.7, 0.5, 0],
  // Glass
  "59_T.002":              [0, 2.0, 0.8],    // windshield
  "59_T":                  [0, 1.5, 0],      // side windows
  "52_T":                  [0, 1.8, -0.5],   // rear glass
  // Interior
  "COCKPIT_HR":            [0, 2.0, 0],
  "STEER_HR":              [0, 2.5, 0.5],
  // Wheels
  "WHEEL_LF":              [-2.5, 0, 1.5],
  "WHEEL_RF":              [2.5, 0, 1.5],
  "WHEEL_LR":              [-2.5, 0, -1.5],
  "WHEEL_RR":              [2.5, 0, -1.5],
  "SUSP_LF":               [-3.0, 0, 1.5],
  "SUSP_RF":               [3.0, 0, 1.5],
  "SUSP_LR":               [-3.0, 0, -1.5],
  "SUSP_RR":               [3.0, 0, -1.5],
  "DISC_LF":               [-3.2, 0, 1.5],
  "DISC_RF":               [3.2, 0, 1.5],
  "DISC_LR":               [-3.2, 0, -1.5],
  "DISC_RR":               [3.2, 0, -1.5],
  // Exterior detail
  "EXT_PLATE_R.001":       [0, 0, -2.0],
  "EXT_PLATE_R_SCREWS":    [0, 0, -2.0],
  "39":                    [0, 0.5, 0],      // black trim
  "blacksolid":            [0, 0.5, 0],
};

/* ================================================================
   COMPONENT
   ================================================================ */

interface SupraProps {
  onSelectPart: (name: string, health: number) => void;
  selectedPart: string | null;
  xray: boolean;
  exploded: boolean;
}

export default function SupraModel({ onSelectPart, selectedPart, xray, exploded }: SupraProps) {
  const { scene } = useGLTF("/models/supra_veilside.glb");
  const groupRef = useRef<Group>(null);
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);

  // Clone scene + clone materials (so each mesh has its own instance)
  const { model, partMeshes, explodeTargets } = useMemo(() => {
    const cloned = scene.clone(true);

    // Clone materials per-mesh so we can modify individually
    // Also fix metallic surfaces: without Environment map, high metalness = black.
    // Cap metalness so surfaces pick up ambient/directional light properly.
    cloned.traverse((child) => {
      if (child instanceof Mesh) {
        if (Array.isArray(child.material)) {
          child.material = child.material.map((m: MeshStandardMaterial) => {
            const c = m.clone();
            if (c.metalness > 0.6) c.metalness = 0.6;
            if (c.roughness < 0.25) c.roughness = 0.25;
            return c;
          });
        } else {
          child.material = child.material.clone();
          const mat = child.material as MeshStandardMaterial;
          if (mat.metalness !== undefined && mat.metalness > 0.6) mat.metalness = 0.6;
          if (mat.roughness !== undefined && mat.roughness < 0.25) mat.roughness = 0.25;
        }
      }
    });

    // Center model: compute bounding box, put bottom at Y=0
    const box = new Box3().setFromObject(cloned);
    const center = box.getCenter(new Vector3());
    const minY = box.min.y;
    cloned.position.set(-center.x, -minY, -center.z);

    // Build partId → Mesh[] mapping
    const pm: Record<string, Mesh[]> = {};
    cloned.traverse((child) => {
      if (child instanceof Mesh) {
        const pid = resolvePartId(child);
        if (!pm[pid]) pm[pid] = [];
        pm[pid].push(child);
      }
    });

    // Collect explodable groups with their original positions
    const et: { obj: Object3D; origPos: Vector3; offset: [number, number, number] }[] = [];
    cloned.traverse((child) => {
      if (!child.name) return;
      const base = stripSuffix(child.name);
      if (explodeGroupMap[base]) {
        et.push({
          obj: child,
          origPos: child.position.clone(),
          offset: explodeGroupMap[base],
        });
      }
    });

    return { model: cloned, partMeshes: pm, explodeTargets: et };
  }, [scene]);

  // Store original material properties once
  const origMats = useRef(new WeakMap<Mesh, { opacity: number; transparent: boolean; depthWrite: boolean }>());
  useEffect(() => {
    model.traverse((child) => {
      if (child instanceof Mesh) {
        const mat = child.material as MeshStandardMaterial;
        origMats.current.set(child, {
          opacity: mat.opacity,
          transparent: mat.transparent,
          depthWrite: mat.depthWrite,
        });
      }
    });
  }, [model]);

  // ─── X-RAY MODE ───
  // Exterior → semi-transparent wireframe + non-raycastable, Interior → fully visible
  useEffect(() => {
    for (const [pid, meshes] of Object.entries(partMeshes)) {
      const def = partDefs[pid];
      const zone = def?.zone ?? "exterior";

      for (const mesh of meshes) {
        const mat = mesh.material as MeshStandardMaterial;
        const orig = origMats.current.get(mesh);

        if (xray && zone === "exterior") {
          mat.transparent = true;
          mat.opacity = 0.06;
          mat.wireframe = true;
          mat.depthWrite = false;
          // Disable raycasting so clicks pass through to interior
          mesh.raycast = () => {};
        } else if (xray && zone === "wheel") {
          mat.transparent = true;
          mat.opacity = 0.15;
          mat.wireframe = true;
          mat.depthWrite = false;
          mesh.raycast = () => {};
        } else if (orig) {
          mat.transparent = orig.transparent;
          mat.opacity = orig.opacity;
          mat.wireframe = false;
          mat.depthWrite = orig.depthWrite;
          // Restore default raycast
          mesh.raycast = Mesh.prototype.raycast;
        }
        mat.needsUpdate = true;
      }
    }
  }, [xray, partMeshes, model]);

  // ─── SELECTION & HOVER HIGHLIGHT ───
  useEffect(() => {
    // Reset all emissive first
    for (const meshes of Object.values(partMeshes)) {
      for (const mesh of meshes) {
        const mat = mesh.material as MeshStandardMaterial;
        mat.emissiveIntensity = 0;
        mat.needsUpdate = true;
      }
    }

    // Apply hover glow (subtle)
    if (hoveredPart && partMeshes[hoveredPart]) {
      const def = partDefs[hoveredPart];
      if (def && isSelectable(def.zone, xray, exploded)) {
        const color = getHealthColor(def.health);
        for (const mesh of partMeshes[hoveredPart]) {
          const mat = mesh.material as MeshStandardMaterial;
          // eslint-disable-next-line react-hooks/immutability
          mat.emissive = new Color(color);
          // eslint-disable-next-line react-hooks/immutability
          mat.emissiveIntensity = 0.15;
          // eslint-disable-next-line react-hooks/immutability
          mat.needsUpdate = true;
        }
      }
    }

    // Apply selection glow (strong) — overrides hover
    if (selectedPart && partMeshes[selectedPart]) {
      const def = partDefs[selectedPart];
      if (def) {
        const color = getHealthColor(def.health);
        for (const mesh of partMeshes[selectedPart]) {
          const mat = mesh.material as MeshStandardMaterial;
          mat.emissive = new Color(color);
          mat.emissiveIntensity = 0.4;
          mat.needsUpdate = true;
        }
      }
    }
  }, [hoveredPart, selectedPart, partMeshes, xray, exploded]);

  // ─── CLICK HANDLER ───
  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (!(e.object instanceof Mesh)) return;

      const pid = resolvePartId(e.object);
      const def = partDefs[pid];
      if (!def) return;

      // Check if selectable in current mode
      if (!isSelectable(def.zone, xray, exploded)) return;

      onSelectPart(pid, def.health);
    },
    [xray, exploded, onSelectPart],
  );

  // ─── HOVER HANDLER ───
  const handlePointerOver = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      if (!(e.object instanceof Mesh)) return;
      const pid = resolvePartId(e.object);
      const def = partDefs[pid];
      if (def && isSelectable(def.zone, xray, exploded)) {
        setHoveredPart(pid);
        document.body.style.cursor = "pointer";
      }
    },
    [xray, exploded],
  );

  const handlePointerOut = useCallback(() => {
    setHoveredPart(null);
    document.body.style.cursor = "auto";
  }, []);

  // ─── ANIMATION: auto-rotate + explode lerp ───
  const _targetVec = useRef(new Vector3());
  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Auto-rotate when nothing selected
    if (!selectedPart) {
      groupRef.current.rotation.y += delta * 0.3;
    }

    // Smooth explode / unexplode
    for (const { obj, origPos, offset } of explodeTargets) {
      const tx = exploded ? origPos.x + offset[0] : origPos.x;
      const ty = exploded ? origPos.y + offset[1] : origPos.y;
      const tz = exploded ? origPos.z + offset[2] : origPos.z;
      _targetVec.current.set(tx, ty, tz);
      obj.position.lerp(_targetVec.current, 0.06);
    }
  });

  // ─── PROCEDURAL PART CLICK ───
  const handleProceduralClick = useCallback(
    (e: ThreeEvent<MouseEvent>, partId: string) => {
      e.stopPropagation();
      const def = partDefs[partId];
      if (!def) return;
      if (!isSelectable(def.zone, xray, exploded)) return;
      onSelectPart(partId, def.health);
    },
    [xray, exploded, onSelectPart],
  );

  const handleProceduralHover = useCallback(
    (e: ThreeEvent<PointerEvent>, partId: string) => {
      e.stopPropagation();
      const def = partDefs[partId];
      if (def && isSelectable(def.zone, xray, exploded)) {
        setHoveredPart(partId);
        document.body.style.cursor = "pointer";
      }
    },
    [xray, exploded],
  );

  // Show engine/chassis only in x-ray or explode mode
  const showEngine = xray || exploded;

  return (
    <group ref={groupRef}>
      <primitive
        object={model}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />

      {/* ═══ PROCEDURAL ENGINE BAY ═══ */}
      {showEngine && (
        <group position={[0, 0, 0]}>
          {/* 2JZ-GTE Engine Block */}
          <ProceduralPart id="Engine.2JZ_Block" position={[0, 0.45, 0.9]} exploded={exploded}
            onClick={handleProceduralClick} onHover={handleProceduralHover} selected={selectedPart} hovered={hoveredPart}>
            <boxGeometry args={[0.7, 0.45, 0.8]} />
            <meshStandardMaterial color="#4a4a4a" metalness={0.5} roughness={0.5} />
          </ProceduralPart>

          {/* Valve Cover */}
          <ProceduralPart id="Engine.Valve_Cover" position={[0, 0.72, 0.9]} exploded={exploded}
            onClick={handleProceduralClick} onHover={handleProceduralHover} selected={selectedPart} hovered={hoveredPart}>
            <boxGeometry args={[0.65, 0.08, 0.7]} />
            <meshStandardMaterial color="#222222" metalness={0.3} roughness={0.4} />
          </ProceduralPart>

          {/* Twin Turbo */}
          <ProceduralPart id="Engine.Turbo_Kit" position={[0.35, 0.35, 0.7]} exploded={exploded}
            onClick={handleProceduralClick} onHover={handleProceduralHover} selected={selectedPart} hovered={hoveredPart}>
            <cylinderGeometry args={[0.1, 0.12, 0.2, 16]} />
            <meshStandardMaterial color="#888" metalness={0.6} roughness={0.3} />
          </ProceduralPart>
          <ProceduralPart id="Engine.Turbo_Kit" position={[-0.35, 0.35, 0.7]} exploded={exploded}
            onClick={handleProceduralClick} onHover={handleProceduralHover} selected={selectedPart} hovered={hoveredPart}>
            <cylinderGeometry args={[0.1, 0.12, 0.2, 16]} />
            <meshStandardMaterial color="#888" metalness={0.6} roughness={0.3} />
          </ProceduralPart>

          {/* Intercooler */}
          <ProceduralPart id="Engine.Intercooler" position={[0, 0.25, 1.5]} exploded={exploded}
            onClick={handleProceduralClick} onHover={handleProceduralHover} selected={selectedPart} hovered={hoveredPart}>
            <boxGeometry args={[0.9, 0.2, 0.08]} />
            <meshStandardMaterial color="#555" metalness={0.5} roughness={0.4} />
          </ProceduralPart>

          {/* Exhaust Manifold */}
          <ProceduralPart id="Engine.Exhaust_Manifold" position={[-0.4, 0.35, 0.95]} exploded={exploded}
            onClick={handleProceduralClick} onHover={handleProceduralHover} selected={selectedPart} hovered={hoveredPart}>
            <cylinderGeometry args={[0.04, 0.04, 0.5, 8]} />
            <meshStandardMaterial color="#8B4513" metalness={0.4} roughness={0.6} />
          </ProceduralPart>

          {/* Intake Manifold */}
          <ProceduralPart id="Engine.Intake_Manifold" position={[0.3, 0.6, 0.85]} exploded={exploded}
            onClick={handleProceduralClick} onHover={handleProceduralHover} selected={selectedPart} hovered={hoveredPart}>
            <boxGeometry args={[0.15, 0.2, 0.5]} />
            <meshStandardMaterial color="#666" metalness={0.4} roughness={0.5} />
          </ProceduralPart>

          {/* Oil Filter */}
          <ProceduralPart id="Engine.Oil_Filter" position={[-0.3, 0.22, 1.1]} exploded={exploded}
            onClick={handleProceduralClick} onHover={handleProceduralHover} selected={selectedPart} hovered={hoveredPart}>
            <cylinderGeometry args={[0.05, 0.05, 0.12, 12]} />
            <meshStandardMaterial color="#1a1a8a" metalness={0.3} roughness={0.6} />
          </ProceduralPart>

          {/* Air Filter */}
          <ProceduralPart id="Engine.Air_Filter" position={[0.45, 0.5, 0.6]} exploded={exploded}
            onClick={handleProceduralClick} onHover={handleProceduralHover} selected={selectedPart} hovered={hoveredPart}>
            <cylinderGeometry args={[0.12, 0.12, 0.15, 16]} />
            <meshStandardMaterial color="#333" metalness={0.2} roughness={0.7} />
          </ProceduralPart>

          {/* Alternator */}
          <ProceduralPart id="Engine.Alternator" position={[-0.4, 0.3, 0.6]} exploded={exploded}
            onClick={handleProceduralClick} onHover={handleProceduralHover} selected={selectedPart} hovered={hoveredPart}>
            <cylinderGeometry args={[0.07, 0.07, 0.1, 12]} />
            <meshStandardMaterial color="#777" metalness={0.5} roughness={0.4} />
          </ProceduralPart>

          {/* Radiator Fan */}
          <ProceduralPart id="Engine.Radiator_Fan" position={[0, 0.4, 1.45]} exploded={exploded}
            onClick={handleProceduralClick} onHover={handleProceduralHover} selected={selectedPart} hovered={hoveredPart}>
            <cylinderGeometry args={[0.2, 0.2, 0.03, 16]} />
            <meshStandardMaterial color="#222" metalness={0.3} roughness={0.5} />
          </ProceduralPart>

          {/* Transmission (Getrag V160) */}
          <ProceduralPart id="Engine.Transmission" position={[0, 0.3, 0.2]} exploded={exploded}
            onClick={handleProceduralClick} onHover={handleProceduralHover} selected={selectedPart} hovered={hoveredPart}>
            <boxGeometry args={[0.35, 0.35, 0.55]} />
            <meshStandardMaterial color="#555" metalness={0.5} roughness={0.4} />
          </ProceduralPart>

          {/* Driveshaft */}
          <ProceduralPart id="Engine.Driveshaft" position={[0, 0.18, -0.5]} rotation={[Math.PI / 2, 0, 0]} exploded={exploded}
            onClick={handleProceduralClick} onHover={handleProceduralHover} selected={selectedPart} hovered={hoveredPart}>
            <cylinderGeometry args={[0.03, 0.03, 1.5, 8]} />
            <meshStandardMaterial color="#888" metalness={0.6} roughness={0.3} />
          </ProceduralPart>

          {/* Coolant Hoses */}
          <ProceduralPart id="Engine.Coolant_Hoses" position={[0.25, 0.55, 1.2]} exploded={exploded}
            onClick={handleProceduralClick} onHover={handleProceduralHover} selected={selectedPart} hovered={hoveredPart}>
            <torusGeometry args={[0.08, 0.02, 8, 16]} />
            <meshStandardMaterial color="#111" roughness={0.9} />
          </ProceduralPart>

          {/* Battery */}
          <ProceduralPart id="Engine.Battery" position={[0.5, 0.35, 0.4]} exploded={exploded}
            onClick={handleProceduralClick} onHover={handleProceduralHover} selected={selectedPart} hovered={hoveredPart}>
            <boxGeometry args={[0.2, 0.18, 0.15]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
          </ProceduralPart>

          {/* ═══ CHASSIS / STRUCTURAL ═══ */}

          {/* Front Subframe */}
          <ProceduralPart id="Chassis.Front_Subframe" position={[0, 0.08, 1.0]} exploded={exploded}
            onClick={handleProceduralClick} onHover={handleProceduralHover} selected={selectedPart} hovered={hoveredPart}>
            <boxGeometry args={[0.9, 0.06, 0.8]} />
            <meshStandardMaterial color="#3a3a3a" metalness={0.4} roughness={0.6} />
          </ProceduralPart>

          {/* Rear Subframe */}
          <ProceduralPart id="Chassis.Rear_Subframe" position={[0, 0.08, -0.9]} exploded={exploded}
            onClick={handleProceduralClick} onHover={handleProceduralHover} selected={selectedPart} hovered={hoveredPart}>
            <boxGeometry args={[0.8, 0.06, 0.6]} />
            <meshStandardMaterial color="#3a3a3a" metalness={0.4} roughness={0.6} />
          </ProceduralPart>

          {/* Floor Pan */}
          <ProceduralPart id="Chassis.Floor_Pan" position={[0, 0.04, 0]} exploded={exploded}
            onClick={handleProceduralClick} onHover={handleProceduralHover} selected={selectedPart} hovered={hoveredPart}>
            <boxGeometry args={[1.0, 0.03, 2.5]} />
            <meshStandardMaterial color="#2a2a2a" metalness={0.3} roughness={0.7} />
          </ProceduralPart>

          {/* Roll Cage */}
          <ProceduralPart id="Chassis.Roll_Cage" position={[0, 0.7, -0.2]} exploded={exploded}
            onClick={handleProceduralClick} onHover={handleProceduralHover} selected={selectedPart} hovered={hoveredPart}>
            <torusGeometry args={[0.4, 0.02, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#ddd" metalness={0.6} roughness={0.3} />
          </ProceduralPart>
        </group>
      )}
    </group>
  );
}

/* ================================================================
   PROCEDURAL PART WRAPPER
   Handles explode offset + highlight for engine/chassis geometry
   ================================================================ */

interface ProceduralPartProps {
  id: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  exploded: boolean;
  onClick: (e: ThreeEvent<MouseEvent>, id: string) => void;
  onHover: (e: ThreeEvent<PointerEvent>, id: string) => void;
  selected: string | null;
  hovered: string | null;
  children: React.ReactNode;
}

function ProceduralPart({ id, position, rotation, exploded, onClick, onHover, selected, hovered, children }: ProceduralPartProps) {
  const ref = useRef<Group>(null);
  const meshRef = useRef<Mesh>(null);
  const targetVec = useRef(new Vector3());
  const def = partDefs[id];
  const isSelected = selected === id;
  const isHovered = hovered === id;

  const explodeDir = def?.explodeDir ?? [0, 0, 0];
  const finalPos: [number, number, number] = exploded
    ? [position[0] + explodeDir[0], position[1] + explodeDir[1], position[2] + explodeDir[2]]
    : position;

  useFrame(() => {
    if (ref.current) {
      targetVec.current.set(...finalPos);
      ref.current.position.lerp(targetVec.current, 0.06);
    }
    // Apply emissive glow via material
    if (meshRef.current) {
      const mat = meshRef.current.material as MeshStandardMaterial;
      if (isSelected) {
        mat.emissive.set(getHealthColor(def?.health ?? 80));
        mat.emissiveIntensity = 0.5;
      } else if (isHovered) {
        mat.emissive.set(getHealthColor(def?.health ?? 80));
        mat.emissiveIntensity = 0.2;
      } else {
        mat.emissiveIntensity = 0;
      }
    }
  });

  return (
    <group ref={ref} position={position} rotation={rotation}>
      <mesh
        ref={meshRef}
        onClick={(e) => onClick(e, id)}
        onPointerOver={(e) => onHover(e, id)}
        onPointerOut={() => { document.body.style.cursor = "auto"; }}
      >
        {children}
      </mesh>
    </group>
  );
}

useGLTF.preload("/models/supra_veilside.glb");
