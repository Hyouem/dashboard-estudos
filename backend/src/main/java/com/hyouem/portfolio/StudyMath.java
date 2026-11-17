package com.hyouem.portfolio;
import java.time.LocalDate;
public final class StudyMath {
  private StudyMath() {}
  public static int completion(int completed,int total) {
    if (total<=0 || completed<0 || completed>total) throw new IllegalArgumentException("Invalid lessons");
    return (int)Math.round(completed*100.0/total);
  }
  public static LocalDate weekStart(LocalDate date) {
    return date.with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
  }
}
