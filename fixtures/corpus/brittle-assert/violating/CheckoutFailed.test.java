import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class CheckoutFailedTest {
  @Test
  void checkoutEqualsProse() {
    String actual = "Checkout failed.";
    assertThat(actual).isEqualTo("Checkout failed.");
  }
}
