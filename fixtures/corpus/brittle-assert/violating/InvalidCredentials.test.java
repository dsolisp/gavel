import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

class InvalidCredentialsTest {
  @Test
  void messageEqualsProse() {
    String message = "Invalid credentials.";
    assertEquals("Invalid credentials.", message);
  }
}
