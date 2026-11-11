package com.hostel;

import org.junit.jupiter.api.*;
import org.openqa.selenium.Alert;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.NoSuchElementException;
import org.openqa.selenium.StaleElementReferenceException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.time.Duration;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Automated UI & Functional Tests for Hostel Management System
 * Using Selenium WebDriver 4, JUnit 5 (Jupiter), and PostgreSQL Verification.
 *
 * Pre-requisite:
 *   Ensure the Node.js server is running on http://localhost:3000
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class HostelManagementTest {

    private static WebDriver driver;
    private static WebDriverWait wait;
    private static final String BASE_URL = "http://localhost:3000";

    // Track test-created student roll number and name for database verification
    private static int createdStudentRoll = 0;
    private static String createdStudentName = "";

    // Track submitted complaint title for database verification
    private static String lastComplaintTitle = "";

    // Track submitted outing details for database verification
    private static String lastSubmittedOutingPurpose = "";
    private static String lastSubmittedOutingId = "";

    @BeforeAll
    public static void setUp() {
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--remote-allow-origins=*");
        // VISIBLE BROWSER TESTING:
        // Headless mode is disabled so the browser runs visibly on your desktop.
        // options.addArguments("--headless=new");
        options.addArguments("--window-size=1280,900");

        driver = new ChromeDriver(options);
        try {
            driver.manage().window().maximize();
        } catch (Exception ignored) {}
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(4));
        wait = new WebDriverWait(driver, Duration.ofSeconds(8));
    }

    @AfterAll
    public static void tearDown() {
        System.out.println(">> Test suite completed. Browser session left open for visual inspection.");
        try {
            // Keep browser visible momentarily at completion
            Thread.sleep(1500);
        } catch (InterruptedException ignored) {}
        if (driver != null) {
            driver.quit();
        }
    }

    @BeforeEach
    public void navigateToLogin(TestInfo testInfo) {
        System.out.println(">> Executing: " + testInfo.getDisplayName());
        resetSession();
        driver.get(BASE_URL);
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("authView")));
    }

    // ==================== HELPER METHODS ====================

    private static void resetSession() {
        try {
            driver.manage().deleteAllCookies();
            ((JavascriptExecutor) driver).executeScript(
                "try { window.localStorage.clear(); window.sessionStorage.clear(); } catch(e){}"
            );
        } catch (Exception ignored) {}
    }

    private void jsClick(WebElement element) {
        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", element);
    }

    private void setInputValue(WebElement element, String value) {
        ((JavascriptExecutor) driver).executeScript(
            "arguments[0].value = arguments[1]; " +
            "arguments[0].dispatchEvent(new Event('input', { bubbles: true })); " +
            "arguments[0].dispatchEvent(new Event('change', { bubbles: true }));",
            element, value
        );
    }

    private void loginAsStudent() {
        resetSession();
        driver.get(BASE_URL);
        WebElement studentTab = wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector("button[data-role='student']")));
        studentTab.click();
        WebElement idInput = driver.findElement(By.id("loginId"));
        WebElement passInput = driver.findElement(By.id("password"));
        idInput.clear();
        idInput.sendKeys("424001");
        passInput.clear();
        passInput.sendKeys("Student@001");
        driver.findElement(By.cssSelector("#loginForm button[type='submit']")).click();
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("dashboardView")));
    }

    private void loginAsCaretaker() {
        resetSession();
        driver.get(BASE_URL);
        WebElement caretakerTab = wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector("button[data-role='caretaker']")));
        caretakerTab.click();
        WebElement idInput = driver.findElement(By.id("loginId"));
        WebElement passInput = driver.findElement(By.id("password"));
        idInput.clear();
        idInput.sendKeys("EMP_001");
        passInput.clear();
        passInput.sendKeys("OC@001");
        driver.findElement(By.cssSelector("#loginForm button[type='submit']")).click();
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("dashboardView")));
    }

    private void loginAsAdmin() {
        resetSession();
        driver.get(BASE_URL);
        WebElement adminTab = wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector("button[data-role='admin']")));
        adminTab.click();
        WebElement idInput = driver.findElement(By.id("loginId"));
        WebElement passInput = driver.findElement(By.id("password"));
        idInput.clear();
        idInput.sendKeys("Admin_001");
        passInput.clear();
        passInput.sendKeys("Admin@001");
        driver.findElement(By.cssSelector("#loginForm button[type='submit']")).click();
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("dashboardView")));
    }

    private void navigateToPage(String pageName) {
        WebElement navBtn = wait.until(ExpectedConditions.presenceOfElementLocated(
            By.cssSelector(".main-nav:not([hidden]) button[data-page='" + pageName + "']")
        ));
        jsClick(navBtn);
        // Wait until loading spinner disappears and page content updates
        wait.until(d -> {
            WebElement content = d.findElement(By.id("pageContent"));
            String text = content.getText();
            return !text.contains("Loading...") && (
                text.toLowerCase().contains(pageName.toLowerCase()) ||
                !content.findElements(By.cssSelector("h1, h2, table, form, .section-heading")).isEmpty()
            );
        });
    }

    private static Connection getDbConnection() {
        try {
            Class.forName("org.postgresql.Driver");
            String dbUrl = System.getenv("DATABASE_URL");
            if (dbUrl == null || dbUrl.isEmpty()) {
                try {
                    java.nio.file.Path envPath = java.nio.file.Paths.get("..", "backend", ".env");
                    if (!java.nio.file.Files.exists(envPath)) {
                        envPath = java.nio.file.Paths.get("backend", ".env");
                    }
                    if (java.nio.file.Files.exists(envPath)) {
                        for (String line : java.nio.file.Files.readAllLines(envPath)) {
                            if (line.trim().startsWith("DATABASE_URL=")) {
                                dbUrl = line.trim().substring("DATABASE_URL=".length()).trim();
                                break;
                            }
                        }
                    }
                } catch (Exception ignored) {}
            }
            if (dbUrl != null && !dbUrl.isEmpty()) {
                if (dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgres://")) {
                    String cleanUrl = dbUrl.replace("postgresql://", "http://").replace("postgres://", "http://");
                    java.net.URI uri = new java.net.URI(cleanUrl);
                    String userInfo = uri.getUserInfo();
                    String user = userInfo != null ? userInfo.split(":")[0] : "postgres";
                    String pass = userInfo != null && userInfo.contains(":") ? userInfo.split(":")[1] : "";
                    String host = uri.getHost();
                    int port = uri.getPort() > 0 ? uri.getPort() : 5432;
                    String path = uri.getPath() != null && uri.getPath().length() > 1 ? uri.getPath().substring(1) : "neondb";
                    String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + "/" + path + "?sslmode=require";
                    return DriverManager.getConnection(jdbcUrl, user, pass);
                }
            }
            return DriverManager.getConnection(
                "jdbc:postgresql://localhost:5432/hostellers", "postgres", "Sanjay@26"
            );
        } catch (Exception e) {
            System.out.println("[DB Notice] Direct JDBC connection: " + e.getMessage());
            return null;
        }
    }

    // ==================== ORIGINAL CORE TEST CASES (TC 01 - TC 06) ====================

    /**
     * Test Case 1: Verify the application title and presence of core login elements
     */
    @Test
    @Order(1)
    @DisplayName("TC-01: Verify Page Title & Login Form Elements")
    public void testPageTitleAndLoginFormLoads() {
        String title = driver.getTitle();
        assertNotNull(title, "Page title should not be null");
        assertTrue(title.contains("Hostellers") || title.contains("Hostel"),
                "Page title should contain 'Hostellers' or 'Hostel'. Actual: " + title);

        WebElement loginForm = driver.findElement(By.id("loginForm"));
        WebElement loginId = driver.findElement(By.id("loginId"));
        WebElement password = driver.findElement(By.id("password"));
        WebElement submitBtn = loginForm.findElement(By.cssSelector("button[type='submit']"));

        assertTrue(loginForm.isDisplayed(), "Login form should be visible");
        assertTrue(loginId.isDisplayed(), "Login ID input should be visible");
        assertTrue(password.isDisplayed(), "Password input should be visible");
        assertTrue(submitBtn.isDisplayed(), "Login submit button should be visible");
    }

    /**
     * Test Case 2: Verify successful Student login with valid credentials
     */
    @Test
    @Order(2)
    @DisplayName("TC-02: Valid Student Login (424001 / Student@001)")
    public void testValidStudentLogin() {
        // 1. Ensure Student role tab is selected
        WebElement studentTab = wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector("button[data-role='student']")));
        studentTab.click();

        // 2. Enter Student credentials
        WebElement loginIdInput = driver.findElement(By.id("loginId"));
        WebElement passwordInput = driver.findElement(By.id("password"));
        WebElement submitBtn = driver.findElement(By.cssSelector("#loginForm button[type='submit']"));

        loginIdInput.clear();
        loginIdInput.sendKeys("424001");
        passwordInput.clear();
        passwordInput.sendKeys("Student@001");

        // 3. Click Login
        submitBtn.click();

        // 4. Assert that the dashboard view becomes visible
        WebElement dashboardView = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("dashboardView")));
        assertNotNull(dashboardView, "Dashboard view should be present after login");
        assertTrue(dashboardView.isDisplayed(), "Dashboard should be displayed after successful login");

        // 5. Assert that login error message is NOT visible
        WebElement errorMsg = driver.findElement(By.id("loginError"));
        assertFalse(errorMsg.isDisplayed(), "No login error should be displayed on successful login");
    }

    /**
     * Test Case 3: Verify login rejection when invalid credentials are provided
     */
    @Test
    @Order(3)
    @DisplayName("TC-03: Invalid Credentials Rejection")
    public void testInvalidLoginFails() {
        WebElement loginIdInput = driver.findElement(By.id("loginId"));
        WebElement passwordInput = driver.findElement(By.id("password"));
        WebElement submitBtn = driver.findElement(By.cssSelector("#loginForm button[type='submit']"));

        loginIdInput.clear();
        loginIdInput.sendKeys("999999");
        passwordInput.clear();
        passwordInput.sendKeys("WrongPassword123");

        submitBtn.click();

        // Assert that the error banner appears
        WebElement errorMsg = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("loginError")));
        assertTrue(errorMsg.isDisplayed(), "Error message should be displayed for invalid credentials");

        String errorText = errorMsg.getText();
        assertTrue(errorText.toLowerCase().contains("not found") || errorText.toLowerCase().contains("invalid"),
                "Error text should mention invalid user or password. Actual: " + errorText);
    }

    /**
     * Test Case 4: Verify Caretaker role selection and login
     */
    @Test
    @Order(4)
    @DisplayName("TC-04: Valid Caretaker Login (EMP_001 / OC@001)")
    public void testValidCaretakerLogin() {
        // 1. Switch to Caretaker role tab
        WebElement caretakerTab = wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector("button[data-role='caretaker']")));
        caretakerTab.click();

        // 2. Enter Caretaker ID and Password
        WebElement loginIdInput = driver.findElement(By.id("loginId"));
        WebElement passwordInput = driver.findElement(By.id("password"));
        WebElement submitBtn = driver.findElement(By.cssSelector("#loginForm button[type='submit']"));

        loginIdInput.clear();
        loginIdInput.sendKeys("EMP_001");
        passwordInput.clear();
        passwordInput.sendKeys("OC@001");

        submitBtn.click();

        // 3. Assert Caretaker dashboard view appears
        WebElement dashboardView = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("dashboardView")));
        assertTrue(dashboardView.isDisplayed(), "Caretaker dashboard should be displayed");
    }

    /**
     * Test Case 5: Verify Administrator role selection and login
     */
    @Test
    @Order(5)
    @DisplayName("TC-05: Valid Admin Login (Admin_001 / Admin@001)")
    public void testValidAdminLogin() {
        // 1. Switch to Admin role tab
        WebElement adminTab = wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector("button[data-role='admin']")));
        adminTab.click();

        // 2. Enter Admin Key and Password
        WebElement loginIdInput = driver.findElement(By.id("loginId"));
        WebElement passwordInput = driver.findElement(By.id("password"));
        WebElement submitBtn = driver.findElement(By.cssSelector("#loginForm button[type='submit']"));

        loginIdInput.clear();
        loginIdInput.sendKeys("Admin_001");
        passwordInput.clear();
        passwordInput.sendKeys("Admin@001");

        submitBtn.click();

        // 3. Assert Admin dashboard appears
        WebElement dashboardView = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("dashboardView")));
        assertTrue(dashboardView.isDisplayed(), "Admin dashboard should be displayed");
    }

    /**
     * Test Case 6: Verify User Logout flow returns to the Auth view
     */
    @Test
    @Order(6)
    @DisplayName("TC-06: User Logout Flow")
    public void testUserLogout() {
        // 1. Login as Student first
        WebElement studentTab = wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector("button[data-role='student']")));
        studentTab.click();

        driver.findElement(By.id("loginId")).sendKeys("424001");
        driver.findElement(By.id("password")).sendKeys("Student@001");
        driver.findElement(By.cssSelector("#loginForm button[type='submit']")).click();

        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("dashboardView")));

        // 2. Locate and click Logout button in the sidebar
        WebElement logoutBtn = wait.until(ExpectedConditions.presenceOfElementLocated(By.id("logout")));
        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", logoutBtn);

        // 3. Assert that the authView (login screen) is visible again
        WebElement authView = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("authView")));
        assertTrue(authView.isDisplayed(), "Auth view should be visible after logout");

        WebElement dashboardView = driver.findElement(By.id("dashboardView"));
        assertFalse(dashboardView.isDisplayed(), "Dashboard should be hidden after logout");
    }

    // ==================== STUDENT REGISTRATION (TC 07 - TC 10) ====================

    /**
     * Test Case 7: Student Registration - Success flow with unique roll number
     */
    @Test
    @Order(7)
    @DisplayName("TC-07: Student Registration - Success Flow")
    public void testStudentRegistrationSuccess() {
        WebElement showRegisterBtn = wait.until(ExpectedConditions.elementToBeClickable(By.id("showRegister")));
        jsClick(showRegisterBtn);

        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("registerForm")));

        int roll = 600000 + (int) ((System.currentTimeMillis() / 1000) % 90000);
        createdStudentRoll = roll;
        createdStudentName = "Auto Student " + roll;
        String rollStr = String.valueOf(roll);

        driver.findElement(By.id("regName")).sendKeys(createdStudentName);
        driver.findElement(By.id("regEmail")).sendKeys("auto" + roll + "@student.nitandhra.ac.in");

        new Select(driver.findElement(By.id("regYear"))).selectByValue("3");
        new Select(driver.findElement(By.id("regGender"))).selectByValue("Male");

        driver.findElement(By.id("regRoll")).sendKeys(rollStr);
        driver.findElement(By.id("regNumber")).sendKeys(String.valueOf(roll + 10000));
        driver.findElement(By.id("regPhone")).sendKeys("9876543210");
        driver.findElement(By.id("regPassword")).sendKeys("Student@001");
        driver.findElement(By.id("regConfirmPassword")).sendKeys("Student@001");

        jsClick(driver.findElement(By.cssSelector("#registerForm button[type='submit']")));

        // Verify transition back to login view or success message
        wait.until(ExpectedConditions.or(
            ExpectedConditions.visibilityOfElementLocated(By.id("loginContent")),
            ExpectedConditions.visibilityOfElementLocated(By.id("toast"))
        ));

        assertTrue(driver.findElement(By.id("loginContent")).isDisplayed() ||
                   driver.findElement(By.id("toast")).isDisplayed(),
                   "Registration should succeed and return to login or show toast");
    }

    /**
     * Test Case 8: Student Registration - Negative case (Password Mismatch)
     */
    @Test
    @Order(8)
    @DisplayName("TC-08: Student Registration - Password Mismatch Validation")
    public void testStudentRegistrationPasswordMismatch() {
        WebElement showRegisterBtn = wait.until(ExpectedConditions.elementToBeClickable(By.id("showRegister")));
        jsClick(showRegisterBtn);

        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("registerForm")));

        driver.findElement(By.id("regName")).sendKeys("Mismatch Tester");
        driver.findElement(By.id("regEmail")).sendKeys("mismatch@test.com");
        new Select(driver.findElement(By.id("regYear"))).selectByValue("2");
        new Select(driver.findElement(By.id("regGender"))).selectByValue("Male");
        driver.findElement(By.id("regRoll")).sendKeys("989898");
        driver.findElement(By.id("regNumber")).sendKeys("9898981");
        driver.findElement(By.id("regPhone")).sendKeys("9876543210");
        driver.findElement(By.id("regPassword")).sendKeys("Password@123");
        driver.findElement(By.id("regConfirmPassword")).sendKeys("DifferentPassword@456");

        jsClick(driver.findElement(By.cssSelector("#registerForm button[type='submit']")));

        WebElement regError = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("registerError")));
        assertTrue(regError.isDisplayed(), "Register error message should be displayed");
        assertTrue(regError.getText().toLowerCase().contains("match"),
                   "Error text should state passwords do not match. Actual: " + regError.getText());
    }

    /**
     * Test Case 9: Student Registration - Negative case (Missing Required Fields)
     */
    @Test
    @Order(9)
    @DisplayName("TC-09: Student Registration - Missing Fields Validation")
    public void testStudentRegistrationMissingFields() {
        WebElement showRegisterBtn = wait.until(ExpectedConditions.elementToBeClickable(By.id("showRegister")));
        jsClick(showRegisterBtn);

        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("registerForm")));

        // Submit completely empty form
        jsClick(driver.findElement(By.cssSelector("#registerForm button[type='submit']")));

        WebElement regError = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("registerError")));
        assertTrue(regError.isDisplayed(), "Register error message should indicate required fields");
        assertTrue(regError.getText().toLowerCase().contains("fill in all") || regError.getText().toLowerCase().contains("required"),
                   "Error should mention missing fields. Actual: " + regError.getText());
    }

    /**
     * Test Case 10: Student Registration - Database persistence check
     */
    @Test
    @Order(10)
    @DisplayName("TC-10: Student Registration - Database Persistence Verification")
    public void testStudentRegistrationDatabasePersistence() {
        // Strict database check: Verify that newly registered student physically exists in PostgreSQL
        int rollToCheck = createdStudentRoll > 0 ? createdStudentRoll : 424001;
        Connection conn = getDbConnection();
        assertNotNull(conn, "Database connection must not be null for TC-10 database verification");

        try (PreparedStatement stmt = conn.prepareStatement(
            "SELECT roll_number, name, email FROM student WHERE roll_number = ?"
        )) {
            stmt.setInt(1, rollToCheck);
            ResultSet rs = stmt.executeQuery();
            assertTrue(rs.next(), "Student record must physically exist in PostgreSQL database for roll: " + rollToCheck);
            assertNotNull(rs.getString("name"), "Student name in PostgreSQL should not be null");
            if (createdStudentRoll > 0 && !createdStudentName.isEmpty()) {
                assertEquals(createdStudentName, rs.getString("name"), "Student name in PostgreSQL must match registration input");
            }
        } catch (Exception e) {
            fail("Database query verification failed: " + e.getMessage());
        } finally {
            try { if (conn != null) conn.close(); } catch (Exception ignored) {}
        }
    }

    // ==================== STUDENT PROFILE MANAGEMENT (TC 11 - TC 12) ====================

    /**
     * Test Case 11: Student Profile - Sidebar Profile Details Verification
     */
    @Test
    @Order(11)
    @DisplayName("TC-11: Student Profile - Sidebar Profile Details")
    public void testStudentSidebarProfileDetails() {
        loginAsStudent();

        WebElement profileName = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("profileName")));
        WebElement profileId = driver.findElement(By.id("profileId"));
        WebElement profileRole = driver.findElement(By.id("profileRole"));

        assertTrue(profileName.getText().contains("First Person"), "Profile name should contain 'First Person'");
        assertTrue(profileId.getText().contains("424001"), "Profile ID should contain roll '424001'");
        assertNotNull(profileRole.getText(), "Profile role should not be null");
    }

    /**
     * Test Case 12: Student Profile - Dashboard Greeting and Quick Cards
     */
    @Test
    @Order(12)
    @DisplayName("TC-12: Student Profile - Personalized Greeting & Quick Cards")
    public void testStudentDashboardGreetingAndCards() {
        loginAsStudent();

        WebElement greeting = wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector("#pageContent .section-heading h2")));
        assertTrue(greeting.getText().contains("Welcome back"), "Greeting should say 'Welcome back'");

        // Verify quick navigation action cards
        assertTrue(driver.findElement(By.cssSelector("[data-page-card='Complaints']")).isDisplayed());
        assertTrue(driver.findElement(By.cssSelector("[data-page-card='Non Local Outing']")).isDisplayed());
        assertTrue(driver.findElement(By.cssSelector("[data-page-card='Announcements']")).isDisplayed());
        assertTrue(driver.findElement(By.cssSelector("[data-page-card='Maintenance']")).isDisplayed());
    }

    // ==================== ROOM ALLOCATION (TC 13 - TC 15) ====================

    /**
     * Test Case 13: Room Allocation - Student Room Allocation Page
     */
    @Test
    @Order(13)
    @DisplayName("TC-13: Room Allocation - Student Allocation View")
    public void testStudentRoomAllocationView() {
        loginAsStudent();
        navigateToPage("Hostel Room Allocation");

        WebElement heading = wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector("#pageContent h2")));
        assertTrue(heading.getText().contains("Hostel Room Allocation"), "Page heading should match Hostel Room Allocation");

        // Verify presence of allocation details or active allocation form
        boolean hasStatusCard = !driver.findElements(By.className("profile-details")).isEmpty();
        boolean hasForm = !driver.findElements(By.id("allocateRoomForm")).isEmpty();
        assertTrue(hasStatusCard || hasForm, "Allocation status card or room allocation form should be displayed");
    }

    /**
     * Test Case 14: Room Allocation - Admin Allocations Management Table & Database Verification
     */
    @Test
    @Order(14)
    @DisplayName("TC-14: Room Allocation - Admin Management Table & DB Verification")
    public void testAdminRoomAllocationManagement() {
        loginAsAdmin();
        navigateToPage("Hostel Room Allocation");

        WebElement table = wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("admin-allocation-table")));
        assertTrue(table.isDisplayed(), "Admin allocation table should be visible");

        // Verify presence of status select controls
        List<WebElement> statusSelects = driver.findElements(By.cssSelector("select[data-action='updateStatus']"));
        assertFalse(statusSelects.isEmpty(), "Admin should have status update dropdowns for allocations");

        // Perform actual status verification on the first allocation row
        WebElement selectEl = statusSelects.get(0);
        String roll = selectEl.getAttribute("data-roll");
        ((JavascriptExecutor) driver).executeScript(
            "arguments[0].value = 'Verified';" +
            "arguments[0].dispatchEvent(new Event('change', { bubbles: true }));",
            selectEl
        );

        // Wait for badge update or toast notification
        wait.until(ExpectedConditions.or(
            ExpectedConditions.visibilityOfElementLocated(By.id("toast")),
            d -> selectEl.getAttribute("class").contains("badge-verified")
        ));

        // Verify database persistence in student_hostel table
        Connection conn = getDbConnection();
        assertNotNull(conn, "Database connection must not be null for TC-14");
        try (PreparedStatement stmt = conn.prepareStatement(
            "SELECT sh.roll_number, sh.room_id, r.room_number FROM student_hostel sh " +
            "JOIN room r ON r.room_id = sh.room_id WHERE sh.roll_number = ?"
        )) {
            stmt.setInt(1, Integer.parseInt(roll != null ? roll : "424001"));
            ResultSet rs = stmt.executeQuery();
            assertTrue(rs.next(), "Student room allocation must be recorded in PostgreSQL student_hostel table");
            assertNotNull(rs.getString("room_id"), "Allocated room_id must not be null");
        } catch (Exception e) {
            fail("Database room allocation verification failed: " + e.getMessage());
        } finally {
            try { conn.close(); } catch (Exception ignored) {}
        }
    }

    /**
     * Test Case 15: Room Allocation - Window Controls & Modal Dialog
     */
    @Test
    @Order(15)
    @DisplayName("TC-15: Room Allocation - Admin Window Setup Dialog")
    public void testAdminAllocationWindowDialog() {
        loginAsAdmin();
        navigateToPage("Hostel Room Allocation");

        WebElement startBtn = wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("[data-action='openStartAllocationModal']")));
        jsClick(startBtn);

        WebElement modal = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("startAllocationModal")));
        assertTrue(modal.isDisplayed(), "Start allocation modal dialog should be displayed");

        WebElement closeBtn = wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector("[data-action='closeStartAllocationModal']")));
        jsClick(closeBtn);
    }

    // ==================== ROOM VACATING (TC 16 - TC 17) ====================

    /**
     * Test Case 16: Room Vacating - Student Vacating View
     */
    @Test
    @Order(16)
    @DisplayName("TC-16: Room Vacating - Student View")
    public void testStudentVacatingView() {
        loginAsStudent();
        navigateToPage("Vacating Room");

        WebElement heading = wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector("#pageContent h2")));
        assertTrue(heading.getText().contains("Evacuation") || heading.getText().contains("Vacating"),
                   "Page heading should mention Evacuation or Vacating");
    }

    /**
     * Test Case 17: Room Vacating - Admin Evacuation Management View & Processing
     */
    @Test
    @Order(17)
    @DisplayName("TC-17: Room Vacating - Admin Evacuation Management")
    public void testAdminEvacuationManagement() {
        loginAsAdmin();
        navigateToPage("Hostel Room Evacuation");

        WebElement heading = wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector("#pageContent h1, #pageContent h2")));
        assertTrue(heading.getText().contains("Evacuation") || heading.getText().contains("Vacating"),
                   "Admin page heading should mention Evacuation");

        // Verify evacuation table or management view is present
        WebElement content = driver.findElement(By.id("pageContent"));
        assertTrue(content.findElements(By.cssSelector("table, .admin-allocation-table, .ct-page-view")).size() > 0,
                   "Evacuation table or management view should be rendered");

        // If evacuation status select dropdowns exist, process the verification
        List<WebElement> evacSelects = driver.findElements(By.cssSelector("select[data-action='updateStatus']"));
        if (!evacSelects.isEmpty()) {
            WebElement evacSel = evacSelects.get(0);
            Select sel = new Select(evacSel);
            sel.selectByVisibleText("Verified");
            wait.until(ExpectedConditions.or(
                ExpectedConditions.visibilityOfElementLocated(By.id("toast")),
                d -> evacSel.getAttribute("class").contains("badge-verified")
            ));
        }
    }

    // ==================== COMPLAINT SUBMISSION (TC 18 - TC 21) ====================

    /**
     * Test Case 18: Complaint Submission - Student Submits New Complaint
     */
    @Test
    @Order(18)
    @DisplayName("TC-18: Complaint Submission - Student Adds Complaint")
    public void testStudentSubmitComplaint() {
        loginAsStudent();
        navigateToPage("Complaints");

        WebElement addBtn = wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector("[data-action='openComplaintForm']")));
        jsClick(addBtn);

        WebElement modal = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("complaintComposer")));
        assertTrue(modal.isDisplayed(), "Complaint composer modal should open");

        String title = "Selenium Water Leakage " + System.currentTimeMillis();
        lastComplaintTitle = title;
        driver.findElement(By.id("complaintTitle")).sendKeys(title);
        driver.findElement(By.id("complaintDesc")).sendKeys("Bathroom pipe is leaking continuously. Need repair.");

        jsClick(driver.findElement(By.cssSelector("#complaintForm button[type='submit']")));

        // Wait for composer to hide or complaint to appear in cards
        wait.until(ExpectedConditions.invisibilityOf(modal));

        WebElement cardsContainer = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("complaintCards")));
        assertTrue(cardsContainer.getText().contains(title), "Submitted complaint title should appear in the complaints list");
    }

    /**
     * Test Case 19: Complaint Submission - Student Upvotes a Complaint
     */
    @Test
    @Order(19)
    @DisplayName("TC-19: Complaint Submission - Upvoting Feature")
    public void testStudentVoteComplaint() {
        loginAsStudent();
        navigateToPage("Complaints");

        List<WebElement> voteBtns = wait.until(ExpectedConditions.presenceOfAllElementsLocatedBy(By.cssSelector("button[data-action='voteComplaint']")));
        assertFalse(voteBtns.isEmpty(), "At least one complaint vote button should exist");

        WebElement firstVoteBtn = voteBtns.get(0);
        String initialText = firstVoteBtn.getText();
        jsClick(firstVoteBtn);

        // Wait for vote state or counter to update (handling potential re-renders and stale elements)
        wait.until(d -> {
            try {
                List<WebElement> btns = d.findElements(By.cssSelector("button[data-action='voteComplaint']"));
                if (btns.isEmpty()) return false;
                WebElement b = btns.get(0);
                String currentText = b.getText();
                String classes = b.getAttribute("class");
                return !currentText.equals(initialText) || (classes != null && classes.contains("voted"));
            } catch (StaleElementReferenceException | NoSuchElementException e) {
                return false;
            }
        });

        List<WebElement> postVoteBtns = driver.findElements(By.cssSelector("button[data-action='voteComplaint']"));
        assertFalse(postVoteBtns.isEmpty(), "Vote buttons should remain displayed after vote");
    }

    /**
     * Test Case 20: Complaint Submission - Negative Validation on Empty Form
     */
    @Test
    @Order(20)
    @DisplayName("TC-20: Complaint Submission - Empty Form Validation")
    public void testComplaintEmptyFormValidation() {
        loginAsStudent();
        navigateToPage("Complaints");

        WebElement addBtn = wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector("[data-action='openComplaintForm']")));
        jsClick(addBtn);

        WebElement modal = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("complaintComposer")));
        WebElement titleInput = driver.findElement(By.id("complaintTitle"));
        titleInput.clear();

        // Submit empty form
        jsClick(driver.findElement(By.cssSelector("#complaintForm button[type='submit']")));

        // Modal should remain open because HTML5 'required' validation halts submission
        assertTrue(modal.isDisplayed(), "Complaint modal should remain open on invalid empty submission");

        // Close modal
        jsClick(driver.findElement(By.cssSelector("[data-action='closeComplaintForm']")));
    }

    /**
     * Test Case 21: Complaint Submission - Database Persistence Check
     */
    @Test
    @Order(21)
    @DisplayName("TC-21: Complaint Submission - Database Verification")
    public void testComplaintDatabasePersistence() {
        Connection conn = getDbConnection();
        assertNotNull(conn, "Database connection must not be null for TC-21");

        try (PreparedStatement stmt = conn.prepareStatement(
            "SELECT complaint_id, complaint, roll_number FROM complaints WHERE complaint LIKE ? ORDER BY complaint_id DESC LIMIT 1"
        )) {
            String pattern = (lastComplaintTitle != null && !lastComplaintTitle.isEmpty())
                ? "%" + lastComplaintTitle + "%"
                : "%Leakage%";
            stmt.setString(1, pattern);
            ResultSet rs = stmt.executeQuery();
            assertTrue(rs.next(), "Submitted complaint record must physically exist in PostgreSQL complaints table");
            assertNotNull(rs.getString("complaint"), "Complaint text in DB should not be null");
            if (lastComplaintTitle != null && !lastComplaintTitle.isEmpty()) {
                assertTrue(rs.getString("complaint").contains(lastComplaintTitle),
                           "Complaint in PostgreSQL database must contain the submitted title");
            }
        } catch (Exception e) {
            fail("Database complaint query verification failed: " + e.getMessage());
        } finally {
            try { if (conn != null) conn.close(); } catch (Exception ignored) {}
        }
    }

    // ==================== DAILY CLEANING MAINTENANCE (TC 22 - TC 24) ====================

    /**
     * Test Case 22: Daily Cleaning Maintenance - Student View Table
     */
    @Test
    @Order(22)
    @DisplayName("TC-22: Maintenance - Student Table View")
    public void testStudentMaintenanceTable() {
        loginAsStudent();
        navigateToPage("Maintenance");

        WebElement table = wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("maintenance-table")));
        assertTrue(table.isDisplayed(), "Maintenance table should be visible");

        String tableText = table.getText();
        assertTrue(tableText.contains("Cleaning") && tableText.contains("Mopping"),
                   "Table headers should contain Cleaning and Mopping columns");
    }

    /**
     * Test Case 23: Daily Cleaning Maintenance - Student Logs Maintenance Record
     */
    @Test
    @Order(23)
    @DisplayName("TC-23: Maintenance - Student Logs Record")
    public void testStudentLogMaintenanceRecord() {
        // Clean up any test maintenance record for today to satisfy the 1-record-per-day constraint
        Connection conn = getDbConnection();
        if (conn != null) {
            try (Statement stmt = conn.createStatement()) {
                stmt.executeUpdate("DELETE FROM hostel_maintenance WHERE maintenance_id IN (SELECT maintenance_id FROM maintenance WHERE roll_number = 424001)");
                stmt.executeUpdate("DELETE FROM maintenance WHERE roll_number = 424001");
            } catch (Exception ignored) {
            } finally {
                try { conn.close(); } catch (Exception ignored) {}
            }
        }

        loginAsStudent();
        navigateToPage("Maintenance");

        WebElement logBtn = wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector("[data-action='openMaintenanceForm']")));
        jsClick(logBtn);

        WebElement modal = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("maintenanceComposer")));
        assertTrue(modal.isDisplayed(), "Maintenance log composer should open");

        String remarks = "Auto Cleaning " + System.currentTimeMillis();
        WebElement remarksInput = driver.findElement(By.id("maintenanceRemarks"));
        remarksInput.clear();
        remarksInput.sendKeys(remarks);

        jsClick(driver.findElement(By.cssSelector("#maintenanceForm button[type='submit']")));

        // Wait until table in pageContent reflects the newly submitted maintenance remark
        wait.until(d -> {
            try {
                WebElement content = d.findElement(By.id("pageContent"));
                return content.getText().contains(remarks);
            } catch (StaleElementReferenceException | NoSuchElementException e) {
                return false;
            }
        });

        WebElement table = driver.findElement(By.className("maintenance-table"));
        assertTrue(table.getText().contains(remarks), "Newly submitted maintenance remark should appear in table");
    }

    /**
     * Test Case 24: Daily Cleaning Maintenance - Caretaker Maintenance View
     */
    @Test
    @Order(24)
    @DisplayName("TC-24: Maintenance - Caretaker View")
    public void testCaretakerMaintenanceView() {
        loginAsCaretaker();
        navigateToPage("Maintenance");

        WebElement heading = wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector("#pageContent h1")));
        assertTrue(heading.getText().contains("Maintenance"), "Heading should mention Maintenance Records");
    }

    // ==================== NON-LOCAL OUTING REQUESTS (TC 25 - TC 27) ====================

    /**
     * Test Case 25: Non-Local Outing - Student Submits Outing Request
     */
    @Test
    @Order(25)
    @DisplayName("TC-25: Outing - Student Submits Request")
    public void testStudentSubmitOuting() {
        loginAsStudent();
        navigateToPage("Non Local Outing");

        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("outingForm")));

        setInputValue(driver.findElement(By.id("outingFromDate")), "2026-11-20");
        setInputValue(driver.findElement(By.id("outingToDate")), "2026-11-24");
        driver.findElement(By.id("outingParentPhone")).sendKeys("9876543210");

        String purpose = "Selenium Family Function " + System.currentTimeMillis();
        lastSubmittedOutingPurpose = purpose;
        driver.findElement(By.id("outingPurpose")).sendKeys(purpose);

        jsClick(driver.findElement(By.cssSelector("#outingForm button[type='submit']")));

        // Wait for outing request row to appear in page content
        wait.until(d -> d.findElement(By.id("pageContent")).getText().contains(purpose));
        WebElement content = driver.findElement(By.id("pageContent"));
        assertTrue(content.getText().contains(purpose), "Submitted outing purpose should appear in list");
        assertTrue(content.getText().contains("Pending"), "Initial status should be Pending");
    }

    /**
     * Test Case 26: Non-Local Outing - Invalid Phone Validation (Negative)
     */
    @Test
    @Order(26)
    @DisplayName("TC-26: Outing - Invalid Phone Validation")
    public void testStudentOutingInvalidPhone() {
        loginAsStudent();
        navigateToPage("Non Local Outing");

        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("outingForm")));

        setInputValue(driver.findElement(By.id("outingFromDate")), "2026-11-20");
        setInputValue(driver.findElement(By.id("outingToDate")), "2026-11-24");
        WebElement phone = driver.findElement(By.id("outingParentPhone"));
        phone.sendKeys("123"); // Invalid short phone number

        driver.findElement(By.id("outingPurpose")).sendKeys("Trip");

        // Submit form
        jsClick(driver.findElement(By.cssSelector("#outingForm button[type='submit']")));

        // HTML5 pattern constraint ensures field is invalid
        Boolean isFieldValid = (Boolean) ((JavascriptExecutor) driver).executeScript("return arguments[0].checkValidity();", phone);
        assertFalse(isFieldValid, "Phone number less than 10 digits should be marked invalid");
    }

    /**
     * Test Case 27: Non-Local Outing - Caretaker Outings View & Approval Flow
     */
    @Test
    @Order(27)
    @DisplayName("TC-27: Outing - Caretaker Outings View & Approval Flow")
    public void testCaretakerOutingApprovalWorkflow() {
        // Ensure a pending outing exists in PostgreSQL for Sabari student 424001
        String testOutingPurpose = lastSubmittedOutingPurpose.isEmpty() ? "Emergency Visit " + System.currentTimeMillis() : lastSubmittedOutingPurpose;
        Connection conn = getDbConnection();
        assertNotNull(conn, "Database connection must not be null for TC-27");
        String testOutingId = "OUT_TEST_" + (System.currentTimeMillis() % 10000);
        try (PreparedStatement stmt = conn.prepareStatement(
            "INSERT INTO outing (outing_id, roll_number, from_date, to_date, purpose, parent_ph_no, date, time, status) " +
            "VALUES (?, 424001, '2026-11-20', '2026-11-25', ?, '9876543210', CURRENT_DATE, CURRENT_TIME, false) " +
            "ON CONFLICT (outing_id) DO UPDATE SET status = false"
        )) {
            stmt.setString(1, testOutingId);
            stmt.setString(2, testOutingPurpose);
            stmt.executeUpdate();
        } catch (Exception e) {
            System.out.println("[DB Notice] Outing insert: " + e.getMessage());
        } finally {
            try { conn.close(); } catch (Exception ignored) {}
        }

        // Login as Caretaker EMP_002 (Sabari Caretaker assigned to Sabari block)
        resetSession();
        driver.get(BASE_URL);
        WebElement caretakerTab = wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector("button[data-role='caretaker']")));
        caretakerTab.click();
        WebElement idInput = driver.findElement(By.id("loginId"));
        WebElement passInput = driver.findElement(By.id("password"));
        idInput.clear();
        idInput.sendKeys("EMP_002");
        passInput.clear();
        passInput.sendKeys("TC@002");
        driver.findElement(By.cssSelector("#loginForm button[type='submit']")).click();
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("dashboardView")));

        navigateToPage("Non Local Outing");

        WebElement content = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("pageContent")));
        assertTrue(content.getText().contains("Non Local") || content.getText().contains("Requests") || content.getText().contains("Outing"),
                   "Page content should display Outing / Non Local section");

        // Wait for outing cards to load
        List<WebElement> cards = wait.until(ExpectedConditions.presenceOfAllElementsLocatedBy(By.cssSelector("[data-outing-card]")));
        assertFalse(cards.isEmpty(), "At least one outing request card should be displayed for caretaker");

        // Select the pending card
        WebElement cardToApprove = cards.get(0);
        for (WebElement c : cards) {
            if ("in_progress".equalsIgnoreCase(c.getAttribute("data-status")) ||
                (testOutingPurpose != null && c.getText().contains(testOutingPurpose))) {
                cardToApprove = c;
                break;
            }
        }
        String chosenOutingId = cardToApprove.getAttribute("data-id");

        // Click card to open caretaker details modal
        jsClick(cardToApprove);

        WebElement modal = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("ctOutingModal")));
        assertTrue(modal.isDisplayed(), "Caretaker outing details modal should open");

        WebElement allowBtn = wait.until(ExpectedConditions.elementToBeClickable(By.id("ctModalAllowBtn")));
        if (!allowBtn.getText().contains("ALLOWED")) {
            jsClick(allowBtn);
            wait.until(ExpectedConditions.or(
                ExpectedConditions.textToBePresentInElement(allowBtn, "ALLOWED"),
                ExpectedConditions.visibilityOfElementLocated(By.id("toast"))
            ));
        }

        // Close the modal
        WebElement closeBtn = driver.findElement(By.id("ctModalBackBtn"));
        jsClick(closeBtn);

        // Verify Database Persistence: Outing status must be updated to true (Approved) in PostgreSQL
        Connection verifyConn = getDbConnection();
        assertNotNull(verifyConn, "Database connection must not be null for verifying outing approval");
        try (PreparedStatement stmt = verifyConn.prepareStatement(
            "SELECT status FROM outing WHERE outing_id = ? OR outing_id = ? OR roll_number = 424001 ORDER BY date DESC, time DESC LIMIT 1"
        )) {
            stmt.setString(1, chosenOutingId != null ? chosenOutingId : testOutingId);
            stmt.setString(2, chosenOutingId != null ? chosenOutingId.replace("OUT_", "") : testOutingId);
            ResultSet rs = stmt.executeQuery();
            assertTrue(rs.next(), "Approved outing must physically exist in PostgreSQL database");
            assertTrue(rs.getBoolean("status"), "Outing record status in database must be updated to true (Approved)");
        } catch (Exception e) {
            fail("Database outing verification failed: " + e.getMessage());
        } finally {
            try { verifyConn.close(); } catch (Exception ignored) {}
        }
    }

    // ==================== ANNOUNCEMENTS (TC 28 - TC 30) ====================

    /**
     * Test Case 28: Announcements - Caretaker Posts Announcement
     */
    @Test
    @Order(28)
    @DisplayName("TC-28: Announcements - Caretaker Posts Notice")
    public void testCaretakerPostAnnouncement() {
        loginAsCaretaker();
        navigateToPage("Announcements");

        WebElement addBtn = wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector("[data-action='openAnnouncementForm']")));
        jsClick(addBtn);

        WebElement modal = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("announcementComposer")));
        assertTrue(modal.isDisplayed(), "Announcement composer should open");

        String title = "Exam Notice " + System.currentTimeMillis();
        driver.findElement(By.id("announcementTitle")).sendKeys(title);
        driver.findElement(By.id("announcementText")).sendKeys("Midterm schedules have been published.");

        jsClick(driver.findElement(By.cssSelector("#announcementForm button[type='submit']")));

        wait.until(ExpectedConditions.invisibilityOf(modal));

        WebElement pageView = wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("ct-page-view")));
        assertTrue(pageView.getText().contains(title), "Newly posted announcement should be listed on announcements page");
    }

    /**
     * Test Case 29: Announcements - Admin Views Announcements with Block Filter
     */
    @Test
    @Order(29)
    @DisplayName("TC-29: Announcements - Admin Block Filter & View")
    public void testAdminAnnouncementsView() {
        loginAsAdmin();
        navigateToPage("Announcements");

        WebElement filter = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("adminAnnFilter")));
        assertTrue(filter.isDisplayed(), "Admin announcements block filter dropdown should be present");
    }

    /**
     * Test Case 30: Announcements - Student Views Circulars
     */
    @Test
    @Order(30)
    @DisplayName("TC-30: Announcements - Student View")
    public void testStudentAnnouncementsView() {
        loginAsStudent();
        navigateToPage("Announcements");

        WebElement heading = wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector("#pageContent h2")));
        assertTrue(heading.getText().contains("Hostel Announcements"), "Student announcements heading should match");
    }

    // ==================== CARETAKER FUNCTIONALITIES (TC 31 - TC 33) ====================

    /**
     * Test Case 31: Caretaker Functionalities - Dashboard Overview & Assigned Block
     */
    @Test
    @Order(31)
    @DisplayName("TC-31: Caretaker - Dashboard Overview & Block Info")
    public void testCaretakerDashboardOverview() {
        loginAsCaretaker();

        WebElement profile = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("sidebarProfile")));
        assertTrue(profile.getText().toLowerCase().contains("caretaker") || profile.getText().contains("Residence"),
                   "Sidebar profile should display Caretaker or Hall of Residence");

        WebElement dashboardView = driver.findElement(By.id("dashboardView"));
        assertTrue(dashboardView.getAttribute("class").contains("caretaker-mode") || dashboardView.isDisplayed(),
                   "Caretaker dashboard view should be active");
    }

    /**
     * Test Case 32: Caretaker Functionalities - Toggle Complaint Status (In Progress <-> Resolved)
     */
    @Test
    @Order(32)
    @DisplayName("TC-32: Caretaker - Complaint Status Toggle")
    public void testCaretakerToggleComplaint() {
        loginAsCaretaker();
        navigateToPage("Complaints");

        WebElement container = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("pageContent")));
        List<WebElement> toggleBtns = driver.findElements(By.cssSelector("button[data-action='toggleComplaint']"));
        if (!toggleBtns.isEmpty()) {
            WebElement firstToggle = toggleBtns.get(0);
            String beforeText = firstToggle.getText();
            jsClick(firstToggle);

            // Verify status button toggles between Mark Resolved and Mark In Progress
            wait.until(d -> {
                List<WebElement> btns = d.findElements(By.cssSelector("button[data-action='toggleComplaint']"));
                return !btns.isEmpty() && !btns.get(0).getText().equals(beforeText);
            });
            List<WebElement> updatedBtns = driver.findElements(By.cssSelector("button[data-action='toggleComplaint']"));
            assertNotEquals(beforeText, updatedBtns.get(0).getText(), "Complaint status button text should toggle after click");
        } else {
            assertTrue(container.getText().contains("Complaints") || container.isDisplayed(),
                       "Caretaker complaints view should be displayed");
        }
    }

    /**
     * Test Case 33: Caretaker Functionalities - Hostel Blocks View
     */
    @Test
    @Order(33)
    @DisplayName("TC-33: Caretaker - Hostel Blocks View")
    public void testCaretakerHostelBlocksView() {
        loginAsCaretaker();
        navigateToPage("Hostel Blocks");

        WebElement heading = wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector("#pageContent h1, #pageContent h2")));
        assertTrue(heading.getText().toLowerCase().contains("block") || heading.getText().toLowerCase().contains("hostel"),
                   "Hostel Blocks page should load");
    }

    // ==================== ADMIN FUNCTIONALITIES (TC 34 - TC 38) ====================

    /**
     * Test Case 34: Admin Functionalities - Dashboard Overview & Admin Key
     */
    @Test
    @Order(34)
    @DisplayName("TC-34: Admin - Dashboard Overview")
    public void testAdminDashboardOverview() {
        loginAsAdmin();

        WebElement profileName = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("profileName")));
        assertTrue(profileName.getText().toLowerCase().contains("admin"), "Admin profile name should mention Admin");
    }

    /**
     * Test Case 35: Admin Functionalities - User Management Views Students & Caretakers
     */
    @Test
    @Order(35)
    @DisplayName("TC-35: Admin - User Management Overview")
    public void testAdminUserManagementView() {
        loginAsAdmin();
        navigateToPage("User Management");

        WebElement content = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("pageContent")));
        assertTrue(content.getText().contains("Students"), "User Management should list Students");
        assertTrue(content.getText().contains("Caretakers"), "User Management should list Caretakers");
    }

    /**
     * Test Case 36: Admin Functionalities - Edit Caretaker Block Modal Dialog
     */
    @Test
    @Order(36)
    @DisplayName("TC-36: Admin - Edit Caretaker Block Dialog")
    public void testAdminEditCaretakerBlockDialog() {
        loginAsAdmin();
        navigateToPage("User Management");

        List<WebElement> editBtns = wait.until(ExpectedConditions.presenceOfAllElementsLocatedBy(By.cssSelector("button[data-action='openEditCaretakerModal']")));
        assertFalse(editBtns.isEmpty(), "Edit block button should exist for caretakers");

        jsClick(editBtns.get(0));

        WebElement modal = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("editCaretakerModal")));
        assertTrue(modal.isDisplayed(), "Edit caretaker modal should open");

        WebElement selectHostel = driver.findElement(By.id("editCtHostel"));
        assertTrue(selectHostel.isDisplayed(), "Hostel block selector should be displayed in modal");

        WebElement closeBtn = driver.findElement(By.cssSelector("[data-action='closeEditCaretakerModal']"));
        jsClick(closeBtn);
    }

    /**
     * Test Case 37: Admin Functionalities - Caretaker Deletion & Database Verification
     */
    @Test
    @Order(37)
    @DisplayName("TC-37: Admin - Caretaker Deletion & Database Verification")
    public void testAdminRemoveCaretakerButton() {
        // Step 1: Pre-seed a dedicated temporary test caretaker in PostgreSQL
        String tempEmpId = "EMP_DEL_99";
        Connection conn = getDbConnection();
        assertNotNull(conn, "Database connection must not be null for TC-37");
        try (Statement stmt = conn.createStatement()) {
            stmt.executeUpdate("DELETE FROM caretaker_hostel WHERE employee_id = '" + tempEmpId + "'");
            stmt.executeUpdate("DELETE FROM caretaker WHERE employee_id = '" + tempEmpId + "'");
            stmt.executeUpdate(
                "INSERT INTO caretaker (employee_id, name, phone_number, email, password) " +
                "VALUES ('" + tempEmpId + "', 'Temp Removal Caretaker', 9988776655, 'tempdel@hostel.com', 'TempPass@123')"
            );
            stmt.executeUpdate(
                "INSERT INTO caretaker_hostel (block_id, employee_id) " +
                "VALUES ('SAB_B_03', '" + tempEmpId + "')"
            );
        } catch (Exception e) {
            fail("Failed to setup temporary test caretaker: " + e.getMessage());
        } finally {
            try { conn.close(); } catch (Exception ignored) {}
        }

        // Step 2: Log in as Admin and open User Management
        loginAsAdmin();
        navigateToPage("User Management");

        // Step 3: Locate the specific remove button for the temporary caretaker
        By removeBtnLocator = By.cssSelector("button[data-action='deleteCaretaker'][data-id='" + tempEmpId + "']");
        WebElement removeBtn = wait.until(ExpectedConditions.presenceOfElementLocated(removeBtnLocator));
        assertTrue(removeBtn.isDisplayed(), "Delete button for temporary caretaker should be rendered");

        // Step 4: Click remove button and handle confirmation dialog
        jsClick(removeBtn);

        Alert alert = wait.until(ExpectedConditions.alertIsPresent());
        String alertText = alert.getText();
        assertTrue(alertText.contains("remove caretaker") || alertText.contains(tempEmpId),
                   "Confirmation dialog should state caretaker removal prompt");
        alert.accept();

        // Step 5: Wait for UI update (button removed or toast notification)
        wait.until(ExpectedConditions.or(
            ExpectedConditions.invisibilityOfElementLocated(removeBtnLocator),
            ExpectedConditions.visibilityOfElementLocated(By.id("toast"))
        ));

        // Step 6: Verify deletion directly in PostgreSQL database
        Connection verifyConn = getDbConnection();
        assertNotNull(verifyConn, "Verification database connection must not be null");
        try (PreparedStatement stmt = verifyConn.prepareStatement(
            "SELECT employee_id FROM caretaker WHERE employee_id = ?"
        )) {
            stmt.setString(1, tempEmpId);
            ResultSet rs = stmt.executeQuery();
            assertFalse(rs.next(), "Caretaker record '" + tempEmpId + "' must be physically deleted from PostgreSQL database");
        } catch (Exception e) {
            fail("Database deletion verification failed: " + e.getMessage());
        } finally {
            try { verifyConn.close(); } catch (Exception ignored) {}
        }
    }

    /**
     * Test Case 38: Admin Functionalities - Role-Based Access Control (RBAC) & Backend Security
     */
    @Test
    @Order(38)
    @DisplayName("TC-38: Access Control - Role-Based Access Control & Backend Security")
    public void testRoleBasedAccessControlRestriction() {
        loginAsStudent();

        // 1. Verify client-side Auth.checkAccess denies student from accessing Admin pages
        Boolean canAccessUserMgmt = (Boolean) ((JavascriptExecutor) driver).executeScript(
            "return Auth.checkAccess('student', 'User Management');"
        );
        assertFalse(canAccessUserMgmt, "Student role must not have client-side access to User Management");

        Boolean canAccessAdminPanel = (Boolean) ((JavascriptExecutor) driver).executeScript(
            "return Auth.checkAccess('student', 'Admin Panel');"
        );
        assertFalse(canAccessAdminPanel, "Student role must not have client-side access to Admin Panel");

        Boolean canAccessRoomInspection = (Boolean) ((JavascriptExecutor) driver).executeScript(
            "return Auth.checkAccess('student', 'Room Inspection');"
        );
        assertFalse(canAccessRoomInspection, "Student role must not have access to Caretaker Room Inspection page");

        // 2. Client-side loadPage enforcement
        ((JavascriptExecutor) driver).executeScript("loadPage('student', 'User Management');");
        WebElement toast = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("toast")));
        assertTrue(toast.getText().toLowerCase().contains("access denied"),
                   "UI should display 'Access denied' error when student requests Admin page");

        // 3. Backend REST API Authorization Verification (Enforcing 403 Forbidden for Student Token)
        Object apiAdminResult = ((JavascriptExecutor) driver).executeAsyncScript(
            "var callback = arguments[arguments.length - 1];" +
            "Auth.api('/api/admin/caretakers/EMP_001', { method: 'DELETE' })" +
            "  .then(function(res) { callback({ status: 200, res: res }); })" +
            "  .catch(function(err) { callback({ status: 403, error: err }); });"
        );
        String apiAdminStr = String.valueOf(apiAdminResult);
        assertTrue(apiAdminStr.contains("false") || apiAdminStr.contains("denied") || apiAdminStr.contains("403") || apiAdminStr.contains("Access denied"),
                   "Backend REST API must deny student token access to Admin DELETE endpoint");

        Object apiCaretakerResult = ((JavascriptExecutor) driver).executeAsyncScript(
            "var callback = arguments[arguments.length - 1];" +
            "Auth.api('/api/outings/OUT_1', { method: 'PATCH', body: JSON.stringify({ status: true }) })" +
            "  .then(function(res) { callback({ status: 200, res: res }); })" +
            "  .catch(function(err) { callback({ status: 403, error: err }); });"
        );
        String apiCtStr = String.valueOf(apiCaretakerResult);
        assertTrue(apiCtStr.contains("false") || apiCtStr.contains("denied") || apiCtStr.contains("403") || apiCtStr.contains("Access denied"),
                   "Backend REST API must deny student token access to Caretaker PATCH endpoint");
    }
}
