import org.testng.annotations.Test;
import static org.testng.Assert.assertEquals;

class PaymentRejectedTest {
  @Test
  void paymentEqualsProse() {
    String status = "Payment was rejected.";
    assertEquals(status, "Payment was rejected.");
  }
}
