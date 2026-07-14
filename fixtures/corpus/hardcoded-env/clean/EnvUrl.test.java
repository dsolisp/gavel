import org.junit.jupiter.api.Test;

class EnvUrlTest {
  @Test
  void usesEnvUrl() {
    String url = System.getenv("API_URL");
  }
}
