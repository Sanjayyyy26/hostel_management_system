# 🏨 Automated Testing Guide: Selenium WebDriver & JUnit 5

This guide explains how **Selenium WebDriver 4** and **JUnit 5 (Jupiter)** automate end-to-end and functional testing for the **Hostel Management System**, and provides step-by-step instructions for running the complete test suite.

---

## 1. What Are Selenium and JUnit?

| Tool | Role | Real-World Analogy |
| :--- | :--- | :--- |
| **Selenium WebDriver 4** | **Hands & Eyes** | An automated robot browser driver that opens Google Chrome, navigates routes, inputs data, clicks buttons, and inspects web page elements on `http://localhost:3000`. |
| **JUnit 5 (Jupiter)** | **Brain & Judge** | A Java testing framework that organizes test methods, runs them in defined sequences (`@TestMethodOrder`), and verifies actual vs. expected results (`assertTrue`, `assertEquals`). |
| **PostgreSQL JDBC** | **Direct Verifier** | Verifies data integrity directly in the database (`student`, `complaints`, `maintenance`) to ensure full-stack persistence. |

---

## 2. Complete Test Suite Overview (TC-01 to TC-38)

All 38 test cases are located in:  
📁 [`testing/src/test/java/com/hostel/HostelManagementTest.java`](src/test/java/com/hostel/HostelManagementTest.java)

| Test ID | Test Name | Target Module | Description & Verification |
| :--- | :--- | :--- | :--- |
| **TC-01** | `testPageTitleAndLoginFormLoads` | Core Auth | Validates page title and presence of `#loginForm`, input fields, and submit button. |
| **TC-02** | `testValidStudentLogin` | Core Auth | Tests valid student login (`424001` / `Student@001`) and confirms `#dashboardView` appears. |
| **TC-03** | `testInvalidLoginFails` | Core Auth | Submits invalid credentials (`999999` / `WrongPassword123`) and asserts rejection message. |
| **TC-04** | `testValidCaretakerLogin` | Core Auth | Tests valid caretaker login (`EMP_001` / `OC@001`) and checks caretaker dashboard load. |
| **TC-05** | `testValidAdminLogin` | Core Auth | Tests valid administrator login (`Admin_001` / `Admin@001`) and verifies admin panel. |
| **TC-06** | `testUserLogout` | Core Auth | Logs in as student and clicks logout in sidebar; confirms return to `#authView`. |
| **TC-07** | `testStudentRegistrationSuccess` | Registration | Completes full registration for a new student and verifies redirect to login view. |
| **TC-08** | `testStudentRegistrationPasswordMismatch` | Registration | Negative test: submits mismatched passwords and confirms error message appears. |
| **TC-09** | `testStudentRegistrationMissingFields` | Registration | Negative test: attempts registration with empty fields; validates HTML5 input validation. |
| **TC-10** | `testStudentRegistrationDatabasePersistence`| Registration | Connects via PostgreSQL JDBC and verifies new student row exists in `student` table. |
| **TC-11** | `testStudentProfileSidebarDetails` | Profile | Verifies sidebar profile elements (student name, roll number, and hostel block). |
| **TC-12** | `testStudentProfileQuickCards` | Profile | Validates dashboard quick-stat cards (Complaints, Outings, Maintenance status). |
| **TC-13** | `testStudentRoomAllocationView` | Room Allocation | Navigates to Room Allocation page as student and verifies allocation status card. |
| **TC-14** | `testAdminRoomAllocationTable` | Room Allocation | Admin view: checks that Room Allocation table contains student rooms and blocks. |
| **TC-15** | `testAdminWindowSetupModal` | Room Allocation | Admin view: opens allocation window composer modal and checks all required fields. |
| **TC-16** | `testStudentRoomVacatingView` | Room Vacating | Student view: navigates to Room Vacating section and verifies request form/status. |
| **TC-17** | `testAdminEvacuationView` | Room Vacating | Admin view: checks Evacuation Management table and action buttons. |
| **TC-18** | `testStudentSubmitComplaint` | Complaints | Student opens complaint composer modal, enters title/description, submits, and verifies in list. |
| **TC-19** | `testStudentVoteComplaint` | Complaints | Tests complaint upvoting; handles dynamic DOM re-rendering and verifies vote state change. |
| **TC-20** | `testComplaintEmptyFormValidation` | Complaints | Negative test: submits empty complaint form; verifies modal stays open with field validation. |
| **TC-21** | `testComplaintDatabasePersistence` | Complaints | Directly queries database `complaints` table using JDBC to verify record storage. |
| **TC-22** | `testStudentMaintenanceTable` | Maintenance | Navigates to Maintenance view as student and verifies daily cleaning/mopping table. |
| **TC-23** | `testStudentLogMaintenanceRecord` | Maintenance | Resets daily rate limit via DB, submits cleaning/mopping log, and verifies record in table. |
| **TC-24** | `testCaretakerMaintenanceView` | Maintenance | Logs in as caretaker and checks block-level daily cleaning maintenance view. |
| **TC-25** | `testStudentSubmitOuting` | Outings | Submits non-local outing request with date range, purpose, and parent phone number. |
| **TC-26** | `testOutingInvalidPhoneValidation` | Outings | Negative test: enters invalid phone number and asserts input rejection. |
| **TC-27** | `testCaretakerOutingsApprovalFlow` | Outings | Caretaker opens outing requests grid, opens request details dialog, and approves request. |
| **TC-28** | `testCaretakerCreateAnnouncement` | Announcements | Caretaker posts announcement notice targeted to assigned block; verifies publication. |
| **TC-29** | `testAdminAnnouncementsBlockFilter` | Announcements | Admin opens announcements view and filters notices across all hostel blocks. |
| **TC-30** | `testStudentAnnouncementsView` | Announcements | Student navigates to Announcements and verifies published notices are readable. |
| **TC-31** | `testCaretakerDashboardOverview` | Caretaker | Verifies caretaker dashboard greeting, assigned block name, and summary metrics. |
| **TC-32** | `testCaretakerComplaintStatusToggle` | Caretaker | Caretaker toggles complaint status between 'Pending' and 'Done' and verifies badge update. |
| **TC-33** | `testCaretakerHostelBlocksView` | Caretaker | Verifies Caretaker Hostel Blocks page renders assigned hostel details properly. |
| **TC-34** | `testAdminDashboardOverview` | Admin | Checks administrator dashboard metrics (Total Students, Hostels, Rooms, Complaints). |
| **TC-35** | `testAdminUserManagementOverview` | Admin | Checks Admin User Management table for student, caretaker, and admin records. |
| **TC-36** | `testAdminEditCaretakerBlockModal` | Admin | Opens modal to edit caretaker's assigned hostel block; verifies select dropdown and close. |
| **TC-37** | `testAdminRemoveCaretakerButtonPresence` | Admin | Verifies action buttons for removing/managing caretakers exist in User Management view. |
| **TC-38** | `testStudentAccessRestrictedFromAdminPages` | Security / RBAC | Attempts to access admin-only routes as student; asserts access restriction. |

---

## 3. Prerequisites

1. **Hostel Application Running**:
   ```bash
   node server.js
   ```
   Ensure `http://localhost:3000` is accessible in your browser.

2. **Google Chrome**:
   Must be installed on your machine. Selenium 4 automatically detects and manages the matching ChromeDriver.

3. **Java JDK 17 or higher**:
   Check your version with:
   ```bash
   java -version
   ```

4. **PostgreSQL Database**:
   Running on `localhost:5432` with database `hostellers` and user `postgres`.

---

## 4. How to Run the Tests

### Option A: Using the Maven Wrapper (Recommended)
From the project root:
```bash
cd testing
./mvnw test
```
*(On Windows: `mvnw.cmd test`)*

### Option B: Using Installed Maven (`mvn`)
```bash
cd testing
mvn test
```

### Option C: Running in VS Code
1. Install the **Extension Pack for Java** extension.
2. Open `testing/src/test/java/com/hostel/HostelManagementTest.java`.
3. Click the green **▶ Run Test** button next to `public class HostelManagementTest` to run all 38 tests, or next to any individual `@Test` method.

### Option D: Running in Eclipse IDE
1. Go to **File** $\to$ **Import...** $\to$ **Maven** $\to$ **Existing Maven Projects**.
2. Select the `/testing` folder and click **Finish**.
3. Right-click `HostelManagementTest.java` $\to$ **Run As** $\to$ **JUnit Test**.
4. The JUnit panel will display the green bar: `Runs: 38/38, Errors: 0, Failures: 0`.

### Option E: Running in IntelliJ IDEA
1. Open the project and navigate to `testing/src/test/java/com/hostel/HostelManagementTest.java`.
2. Right-click the class name and click **Run 'HostelManagementTest'**.

---

## 5. Test Reports & Logs

- **Markdown Test Report**: [`testing/TEST_EXECUTION_REPORT.md`](TEST_EXECUTION_REPORT.md)
- **Maven Surefire XML Report**: `testing/target/surefire-reports/TEST-com.hostel.HostelManagementTest.xml`
- **Surefire Text Summary**: `testing/target/surefire-reports/com.hostel.HostelManagementTest.txt`
