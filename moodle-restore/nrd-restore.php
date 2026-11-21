<?php
// Script temporar de restaurare a cursurilor. Se șterge automat după rulare.
define('NO_DEBUG_DISPLAY', true);
require(__DIR__ . '/config.php');
require_once($CFG->dirroot . '/backup/util/includes/restore_includes.php');
require_once($CFG->libdir . '/badgeslib.php');
header('Content-Type: application/json; charset=utf-8');
$token = '__TOKEN__';
if (strlen($token) < 32 || !hash_equals($token, (string)($_GET['k'] ?? ''))) { http_response_code(403); echo '{"eroare":"acces"}'; exit; }
$f = basename((string)($_GET['f'] ?? ''));
$path = __DIR__ . '/nrd-restore-files/' . $f;
if (!preg_match('/^curs-[a-z-]+-moodle45\.mbz$/', $f) || !is_file($path)) { http_response_code(404); echo '{"eroare":"fisier"}'; exit; }
core_php_time_limit::raise(600);
raise_memory_limit(MEMORY_EXTRA);
\core\session\manager::set_user(get_admin());
try {
  $dir = 'nrd' . md5($f . microtime());
  get_file_packer('application/vnd.moodle.backup')->extract_to_pathname($path, make_backup_temp_directory($dir));
  $info = backup_general_helper::get_backup_information($dir);
  $short = $info->original_course_shortname;
  if ($old = $DB->get_record('course', ['shortname' => $short])) {
    $nmods = $DB->count_records('course_modules', ['course' => $old->id]);
    $nusers = $DB->count_records_sql("SELECT COUNT(ue.id) FROM {user_enrolments} ue JOIN {enrol} e ON e.id = ue.enrolid WHERE e.courseid = ?", [$old->id]);
    $nq = $DB->count_records_sql("SELECT COUNT(e.id) FROM {question_bank_entries} e JOIN {question_categories} qc ON qc.id = e.questioncategoryid WHERE qc.contextid = ?", [context_course::instance($old->id)->id]);
    $gol = ($nmods <= 1 && $nusers == 0 && $nq == 0);
    if (!$gol || ($_GET['inlocuieste'] ?? '') !== '1') { echo json_encode(['fisier' => $f, 'stare' => 'exista deja', 'curs' => $short, 'id' => $old->id, 'activitati' => $nmods, 'inscrisi' => $nusers, 'intrebari' => $nq, 'gol' => $gol], JSON_UNESCAPED_UNICODE); exit; }
    ob_start(); delete_course($old, false); ob_end_clean();
  }
  $cat = core_course_category::get_default();
  $cid = restore_dbops::create_new_course($info->original_course_fullname, $short, $cat->id);
  $rc = new restore_controller($dir, $cid, backup::INTERACTIVE_NO, backup::MODE_GENERAL, get_admin()->id, backup::TARGET_NEW_COURSE);
  if (!$rc->execute_precheck()) { $pre = $rc->get_precheck_results(); if (!empty($pre['errors'])) throw new Exception(json_encode($pre['errors'])); }
  $rc->execute_plan(); $rc->destroy();
  $badges = 0;
  foreach ($DB->get_records('badge', ['courseid' => $cid]) as $b) { $badge = new badge($b->id); if ($badge->has_criteria()) { $badge->set_status(BADGE_STATUS_ACTIVE); $badges++; } }
  $c = $DB->get_record('course', ['id' => $cid]);
  $mods = $DB->count_records('course_modules', ['course' => $cid]);
  echo json_encode(['fisier' => $f, 'stare' => 'restaurat', 'id' => $cid, 'curs' => $c->shortname, 'nume' => $c->fullname, 'activitati' => $mods, 'insigne_active' => $badges, 'vizibil' => (int)$c->visible], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) { http_response_code(500); echo json_encode(['fisier' => $f, 'eroare' => $e->getMessage()], JSON_UNESCAPED_UNICODE); }
