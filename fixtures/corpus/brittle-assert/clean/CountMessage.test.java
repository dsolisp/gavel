import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;

class CountMessageTest {
  @Test
  void countMatchesWithProseMessage() {
    int actual = 2;
    assertEquals(2, actual, "Payment count mismatch.");
  }
}
