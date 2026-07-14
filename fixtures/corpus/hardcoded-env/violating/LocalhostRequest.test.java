import org.junit.jupiter.api.Test;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.URI;

class LocalhostTest {
  @Test
  void fetchesFromLocalhost() throws Exception {
    HttpClient client = HttpClient.newHttpClient();
    client.send(HttpRequest.newBuilder().uri(URI.create("http://localhost:8080/api")).build(), null);
  }
}
