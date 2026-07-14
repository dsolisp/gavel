import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

enum HttpStatus {
  NOT_FOUND
}

class HttpStatusTest {
  @Test
  void statusEqualsEnum() {
    assertEquals(HttpStatus.NOT_FOUND, HttpStatus.NOT_FOUND);
  }
}
