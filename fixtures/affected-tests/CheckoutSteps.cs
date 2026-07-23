using Reqnroll;

namespace Gavel.Fixtures;

// Thin SpecFlow/Reqnroll binding: demonstrates a .feature file whose @tags are
// discovered via the cucumber extract-tags pattern, paired with C# step
// definitions. Contract: docs/contracts/dotnet-ecosystem-v0.10.0.md (extract-tags).
[Binding]
public class CheckoutSteps
{
    [Given("a signed-in shopper")]
    public void GivenASignedInShopper() { }

    [When("they pay with a saved card")]
    public void WhenTheyPayWithASavedCard() { }

    [Then("the order is confirmed")]
    public void ThenTheOrderIsConfirmed() { }
}
