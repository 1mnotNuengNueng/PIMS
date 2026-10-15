-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 03, 2026 at 05:18 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `warehouse`
--

-- --------------------------------------------------------

--
-- Table structure for table `major`
--

CREATE TABLE `major` (
  `id` int(11) NOT NULL,
  `name` varchar(500) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `operating_budget`
--

CREATE TABLE `operating_budget` (
  `id` int(11) NOT NULL,
  `name` text NOT NULL,
  `budget_detail` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `project_form`
--

CREATE TABLE `project_form` (
  `id` int(11) NOT NULL,
  `name` varchar(500) NOT NULL,
  `strategic_plan_id` int(11) NOT NULL,
  `responsible_person` varchar(500) NOT NULL,
  `principles_rationale` text NOT NULL,
  `objective` text NOT NULL,
  `target_group` text NOT NULL,
  `implementation_procedure` text NOT NULL,
  `duration_of_operations` text NOT NULL,
  `location` text NOT NULL,
  `evaluation` text NOT NULL,
  `expected_outcomes` text NOT NULL,
  `operating_budget_id` int(11) NOT NULL,
  `create_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `update_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `create_by` int(11) NOT NULL,
  `status` enum('approve','cancel','resubmit','') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `strategic_plan`
--

CREATE TABLE `strategic_plan` (
  `id` int(11) NOT NULL,
  `name` varchar(500) NOT NULL,
  `strategic_details` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `id` int(11) NOT NULL,
  `Email` varchar(500) NOT NULL,
  `hash_password` varchar(500) NOT NULL,
  `Role` enum('admin','staff','super_admin') NOT NULL,
  `Major_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `major`
--
ALTER TABLE `major`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `operating_budget`
--
ALTER TABLE `operating_budget`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `project_form`
--
ALTER TABLE `project_form`
  ADD PRIMARY KEY (`id`),
  ADD KEY `strategic_plan_id` (`strategic_plan_id`,`operating_budget_id`),
  ADD KEY `create_by` (`create_by`),
  ADD KEY `operating_budget_id` (`operating_budget_id`);

--
-- Indexes for table `strategic_plan`
--
ALTER TABLE `strategic_plan`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Major_id` (`Major_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `major`
--
ALTER TABLE `major`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `operating_budget`
--
ALTER TABLE `operating_budget`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `project_form`
--
ALTER TABLE `project_form`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `strategic_plan`
--
ALTER TABLE `strategic_plan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `project_form`
--
ALTER TABLE `project_form`
  ADD CONSTRAINT `project_form_ibfk_1` FOREIGN KEY (`operating_budget_id`) REFERENCES `operating_budget` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `project_form_ibfk_2` FOREIGN KEY (`strategic_plan_id`) REFERENCES `strategic_plan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `project_form_ibfk_3` FOREIGN KEY (`create_by`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `user`
--
ALTER TABLE `user`
  ADD CONSTRAINT `user_ibfk_1` FOREIGN KEY (`Major_id`) REFERENCES `major` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

-- ========================================================
-- MOCK DATA (ข้อมูลจำลองสำหรับทดสอบ)
-- ========================================================

--
-- Mock data for table `major`
--
INSERT INTO `major` (`id`, `name`) VALUES
(1, 'วิทยาการคอมพิวเตอร์'),
(2, 'เทคโนโลยีสารสนเทศ');

--
-- Mock data for table `operating_budget`
--
INSERT INTO `operating_budget` (`id`, `name`, `budget_detail`) VALUES
(1, 'งบประมาณแผ่นดิน', 'งบประมาณที่ได้รับการจัดสรรจากภาครัฐ เพื่อใช้ในการดำเนินโครงการพัฒนาการศึกษา'),
(2, 'งบรายได้ของมหาวิทยาลัย', 'งบประมาณที่มาจากค่าธรรมเนียมการศึกษาและรายได้อื่น ๆ ของมหาวิทยาลัย');

--
-- Mock data for table `strategic_plan`
--
INSERT INTO `strategic_plan` (`id`, `name`, `strategic_details`) VALUES
(1, 'ยุทธศาสตร์ที่ 1: พัฒนาคุณภาพการศึกษา', 'มุ่งเน้นการพัฒนาหลักสูตรและการเรียนการสอนให้มีคุณภาพสูง เพื่อผลิตบัณฑิตที่มีสมรรถนะตรงกับความต้องการของตลาดแรงงาน'),
(2, 'ยุทธศาสตร์ที่ 2: วิจัยและนวัตกรรม', 'ส่งเสริมการวิจัยและสร้างนวัตกรรมที่ตอบสนองต่อความต้องการของสังคมและภาคอุตสาหกรรม');

--
-- Mock data for table `user`
-- hash_password = bcrypt hash ของ "password123" (cost factor 10)
-- admin@pims.ac.th → Role: admin
-- staff@pims.ac.th → Role: staff
--
INSERT INTO `user` (`id`, `Email`, `hash_password`, `Role`, `Major_id`) VALUES
(1, 'admin@pims.ac.th', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36zLNxJBFKxvFBNpONW2zfq', 'admin', 1),
(2, 'staff@pims.ac.th', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'staff', 2);

--
-- Mock data for table `project_form`
--
INSERT INTO `project_form` (
  `id`, `name`, `strategic_plan_id`, `responsible_person`,
  `principles_rationale`, `objective`, `target_group`,
  `implementation_procedure`, `duration_of_operations`, `location`,
  `evaluation`, `expected_outcomes`, `operating_budget_id`,
  `create_at`, `update_at`, `create_by`, `status`
) VALUES
(1,
  'โครงการพัฒนาทักษะดิจิทัลสำหรับนักศึกษา',
  1,
  'อาจารย์สมชาย ใจดี',
  'ในยุคดิจิทัล นักศึกษาจำเป็นต้องมีทักษะการใช้เทคโนโลยีเพื่อรองรับตลาดแรงงานในอนาคต',
  'เพื่อพัฒนาทักษะดิจิทัลของนักศึกษาชั้นปีที่ 1-4 ให้ครอบคลุมการใช้งาน AI และ Cloud Computing',
  'นักศึกษาสาขาวิทยาการคอมพิวเตอร์ ชั้นปีที่ 1-4 จำนวน 120 คน',
  '1. จัดอบรมเชิงปฏิบัติการ 2. ทดสอบทักษะก่อน-หลัง 3. ประเมินผลความพึงพอใจ',
  '3 เดือน (มกราคม - มีนาคม 2568)',
  'ห้องปฏิบัติการคอมพิวเตอร์ อาคาร IT ชั้น 3',
  'ประเมินผลโดยแบบทดสอบก่อน-หลังการอบรม และแบบสอบถามความพึงพอใจ',
  'นักศึกษามีทักษะดิจิทัลเพิ่มขึ้นไม่น้อยกว่า 80% และมีความพึงพอใจในระดับดีมาก',
  1,
  '2026-01-10 08:00:00',
  '2026-01-10 08:00:00',
  2,
  'approve'
),
(2,
  'โครงการวิจัยระบบแนะนำหลักสูตรด้วย Machine Learning',
  2,
  'อาจารย์สุดา รักเรียน',
  'ปัจจุบันนักศึกษามักประสบปัญหาในการเลือกหลักสูตรที่เหมาะสมกับตนเอง การนำ ML มาช่วยแนะนำจะช่วยลดปัญหาดังกล่าว',
  'เพื่อพัฒนาระบบแนะนำหลักสูตรอัจฉริยะโดยใช้ Machine Learning Algorithm ที่มีความแม่นยำสูง',
  'นักศึกษาใหม่และอาจารย์ที่ปรึกษาทั้งหมดในคณะ',
  '1. รวบรวมข้อมูลประวัตินักศึกษา 2. ฝึก Model ML 3. พัฒนา Web Application 4. ทดสอบระบบ 5. ปรับปรุงแก้ไข',
  '6 เดือน (มีนาคม - สิงหาคม 2568)',
  'ห้องวิจัย AI Lab อาคารวิทยาศาสตร์ ชั้น 5',
  'วัดความแม่นยำของระบบ (Accuracy ≥ 85%) และความพึงพอใจของผู้ใช้งาน',
  'ได้ระบบแนะนำหลักสูตรที่มีความแม่นยำสูง และตีพิมพ์ผลงานวิจัยในวารสารระดับชาติอย่างน้อย 1 ฉบับ',
  2,
  '2026-02-15 09:30:00',
  '2026-03-01 14:00:00',
  2,
  'resubmit'
),
(3,
  'โครงการส่งเสริมการเรียนรู้ผ่านสื่อมัลติมีเดีย',
  1,
  'อาจารย์วิชัย สอนดี',
  'สื่อมัลติมีเดียช่วยเพิ่มประสิทธิภาพการเรียนรู้และทำให้นักศึกษาสนใจเนื้อหามากขึ้น',
  'เพื่อผลิตสื่อการเรียนการสอนในรูปแบบวิดีโอและ Interactive Content สำหรับวิชาหลักในหลักสูตร',
  'นักศึกษาสาขาเทคโนโลยีสารสนเทศ ชั้นปีที่ 2-3 จำนวน 80 คน',
  '1. สำรวจวิชาที่ต้องการสื่อ 2. ออกแบบ Storyboard 3. ผลิตสื่อวิดีโอ 4. เผยแพร่บน LMS',
  '4 เดือน (พฤษภาคม - สิงหาคม 2568)',
  'ห้องสตูดิโอผลิตสื่อ อาคารนิเทศศาสตร์ ชั้น 2',
  'ประเมินผลการเรียนรู้ก่อน-หลัง และสำรวจความพึงพอใจของนักศึกษาต่อสื่อที่ผลิต',
  'ได้สื่อการเรียนการสอนคุณภาพสูงไม่น้อยกว่า 10 รายวิชา และนักศึกษามีผลสัมฤทธิ์ทางการเรียนสูงขึ้น',
  1,
  '2026-03-05 10:00:00',
  '2026-03-05 10:00:00',
  2,
  ''
);

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
