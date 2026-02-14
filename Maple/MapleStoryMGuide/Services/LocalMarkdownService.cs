using System.Net.Http.Json;
using System.Text.RegularExpressions;
using System.Reflection;

namespace MapleStoryMGuide.Services;

public class LocalMarkdownService : IMarkdownService
{
    private readonly HttpClient _httpClient;

    public LocalMarkdownService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<string> LoadContentAsync(string fileName)
    {
        var filePath = $"data/{fileName}";
        try 
        {
            return await _httpClient.GetStringAsync(filePath);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error loading markdown file {fileName}: {ex.Message}");
            return string.Empty;
        }
    }

    public async Task<List<T>> LoadTableDataAsync<T>(string fileName) where T : class, new()
    {
        var content = await LoadContentAsync(fileName);
        if (string.IsNullOrEmpty(content))
            return new List<T>();

        return ParseMarkdownTable<T>(content);
    }

    private List<T> ParseMarkdownTable<T>(string markdown) where T : class, new()
    {
        var result = new List<T>();
        var lines = markdown.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
        
        // Find table start
        int headerIndex = -1;
        for (int i = 0; i < lines.Length; i++)
        {
            if (lines[i].Trim().StartsWith("|") && lines[i].Contains("|"))
            {
                // Check if next line is separator
                if (i + 1 < lines.Length && lines[i+1].Trim().StartsWith("|") && lines[i+1].Contains("---"))
                {
                    headerIndex = i;
                    break;
                }
            }
        }

        if (headerIndex == -1) return result;

        var headers = ParseRow(lines[headerIndex]);
        var properties = typeof(T).GetProperties();
        
        // Map headers to properties (simple name matching for now)
        var propertyMap = new Dictionary<int, PropertyInfo>();
        for (int i = 0; i < headers.Count; i++)
        {
            // Simple heuristic: map column index to property based on order or name
            // For this implementation, let's assume the Markdown table columns match the class properties order
            // Or we could try to match names if we had attributes.
            // Let's rely on order for simplicity as per TAD example context, or match by name?
            // The TAD models have English names, Markdown headers are Chinese.
            // We might need a mapping mechanism.
            // For now, let's just return empty or implement a very basic order-based mapping if properties count matches.
            
            if (i < properties.Length)
            {
                propertyMap[i] = properties[i];
            }
        }

        // Parse rows
        for (int i = headerIndex + 2; i < lines.Length; i++)
        {
            var line = lines[i].Trim();
            if (!line.StartsWith("|")) break; // End of table

            var values = ParseRow(line);
            var item = new T();
            
            for (int j = 0; j < values.Count && j < propertyMap.Count; j++)
            {
                if (propertyMap.TryGetValue(j, out var prop))
                {
                    try
                    {
                        var value = values[j];
                        if (prop.PropertyType == typeof(decimal))
                        {
                            // Remove currency symbols and non-numeric chars except dot
                            var numStr = Regex.Replace(value, @"[^\d.]", "");
                            if (decimal.TryParse(numStr, out decimal num))
                                prop.SetValue(item, num);
                        }
                        else if (prop.PropertyType == typeof(int))
                        {
                             var numStr = Regex.Replace(value, @"[^\d]", "");
                             if (int.TryParse(numStr, out int num))
                                prop.SetValue(item, num);
                        }
                        else
                        {
                            prop.SetValue(item, value);
                        }
                    }
                    catch { }
                }
            }
            result.Add(item);
        }

        return result;
    }

    private List<string> ParseRow(string line)
    {
        // Remove leading/trailing pipes
        line = line.Trim('|');
        return line.Split('|').Select(c => c.Trim()).ToList();
    }
}
