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
import org.jboss.logging.Logger;

@QuarkusTest
class HomePageTest {

    private static final Logger LOG = Logger.getLogger(HomePageTest.class);
    static Playwright playwright;
    static Browser browser;
    BrowserContext context;
    Page page;

    // Test port configured via quarkus.http.test-port=8081
    private static final String BASE_URL = "http://localhost:8081";

    @BeforeAll
    static void globalSetup() {
        LOG.info("Initializing Playwright Manually...");
        try {
            playwright = Playwright.create();
            browser = playwright.chromium().launch(new BrowserType.LaunchOptions().setHeadless(true));
            LOG.info("Playwright initialized.");
        } catch (Exception e) {
            LOG.error("Failed to initialize Playwright", e);
            throw e;
        }
    }

    @AfterAll
    static void globalTeardown() {
        if (browser != null) browser.close();
        if (playwright != null) playwright.close();
    }

    @BeforeEach
    void setup() {
        context = browser.newContext();
        page = context.newPage();
    }

    @AfterEach
    void tearDown() {
        if (context != null) context.close();
    }

    @Test
    void testHomePageLoads() {
        LOG.info("Navigating to " + BASE_URL);
        page.navigate(BASE_URL);

        // Verify Title
        String title = page.title();
        LOG.info("Page Title: " + title);
        Assertions.assertTrue(title.contains("AWS Cognito Demo App"), "Title should match. Found: " + title);

        // Verify Content
        Assertions.assertTrue(page.isVisible("text='Welcome!'"), "Should show Welcome message");
        Assertions.assertTrue(page.isVisible("text='Sign in'"), "Should show Sign in link");
        Assertions.assertTrue(page.isVisible("text='Quarkus'"), "Should show stack info");
    }
}
