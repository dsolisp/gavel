import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Tag;

class LoginTest {
    @Test
    @Tag("smoke")
    @Tag("ci.fast")
    void validLoginSucceeds() {
    }

    @Test
    @Tag("e2e-smoke")
    void smokeEndToEndLogin() {
    }

    @Test
    @Tag("regression")
    void invalidLoginShowsError() {
    }
}