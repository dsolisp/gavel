using Microsoft.Playwright;
using NUnit.Framework;

namespace Gavel.Fixtures;

public class ServiceInjectionTests
{
    private IAPIContext _api;

    [SetUp]
    public void Setup(IAPIContext api)
    {
        _api = api;
    }

    [Test]
    public void Api_UsesInjectedClient()
    {
        var response = _api.GetAsync("/health");
    }
}
