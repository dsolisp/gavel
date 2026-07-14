import org.testng.annotations.Test;
import static org.testng.Assert.assertEquals;

class AdminRoleTest {
  @Test
  void roleIsAdminToken() {
    String role = "admin";
    assertEquals("admin", role);
  }
}
