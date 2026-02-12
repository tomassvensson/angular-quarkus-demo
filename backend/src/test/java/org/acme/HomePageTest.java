package org.acme;

import com.microsoft.playwright.Browser;
import com.microsoft.playwright.BrowserContext;
import com.microsoft.playwright.BrowserType;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.Playwright;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

@QuarkusTest
public class HomePageTest {

    static Playwright playwright;
    static Browser browser;
    BrowserContext context;
    Page page;

    // Test port configured via quarkus.http.test-port=8081
    private static final String BASE_URL = "http://localhost:8081";

    @BeforeAll
    public static void globalSetup() {
        System.out.println("Initializing Playwright Manually...");
        try {
            playwright = Playwright.create();
            browser = playwright.chromium().launch(new BrowserType.LaunchOptions().setHeadless(true));
            System.out.println("Playwright initialized.");
        } catch (Exception e) {
            System.err.println("Failed to initialize Playwright: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @AfterAll
    public static void globalTeardown() {
        if (browser != null) browser.close();
        if (playwright != null) playwright.close();
    }

    @BeforeEach
    public void setup() {
        context = browser.newContext();
        page = context.newPage();
    }

    @AfterEach
    public void tearDown() {
        if (context != null) context.close();
    }

    @Test
    public void testHomePageLoads() {
        System.out.println("Navigating to " + BASE_URL);
        page.navigate(BASE_URL);

        // Verify Title
        String title = page.title();
        System.out.println("Page Title: " + title);
        Assertions.assertTrue(title.contains("AWS Cognito Demo App"), "Title should match. Found: " + title);

        // Verify Content
        Assertions.assertTrue(page.isVisible("text='Welcome!'"), "Should show Welcome message");
        Assertions.assertTrue(page.isVisible("text='Sign in'"), "Should show Sign in link");
        Assertions.assertTrue(page.isVisible("text='Quarkus'"), "Should show stack info");
    }
}
