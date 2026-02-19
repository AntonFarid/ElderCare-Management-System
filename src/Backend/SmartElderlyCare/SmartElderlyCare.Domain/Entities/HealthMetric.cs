using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SmartElderlyCare.Domain.Common;
using SmartElderlyCare.Domain.Enums;

namespace SmartElderlyCare.Domain.Entities;

public class HealthMetric : BaseEntity
{
    public int DailyReportId { get; set; }
    public MetricType MetricType { get; set; }
    public string MetricName { get; set; } = string.Empty;
    public string MetricValue { get; set; } = string.Empty;
    public string? Unit { get; set; }
    public string? Notes { get; set; }
    public TimeSpan RecordedTime { get; set; }

    // Navigation property
    public virtual DailyReport DailyReport { get; set; } = null!;
}