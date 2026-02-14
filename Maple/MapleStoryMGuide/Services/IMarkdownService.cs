namespace MapleStoryMGuide.Services;

public interface IMarkdownService
{
    Task<string> LoadContentAsync(string fileName);
    Task<List<T>> LoadTableDataAsync<T>(string fileName) where T : class, new();
}
