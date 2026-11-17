package com.hyouem.portfolio;
import static org.junit.jupiter.api.Assertions.*;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
class StudyMathTest {
  @Test void zeroProgress() { assertEquals(0,StudyMath.completion(0,10)); }
  @Test void partialProgress() { assertEquals(60,StudyMath.completion(3,5)); }
  @Test void completedProgress() { assertEquals(100,StudyMath.completion(8,8)); }
  @Test void rejectsInvalidProgress() { assertThrows(IllegalArgumentException.class,()->StudyMath.completion(6,5)); }
  @Test void weekBeginsOnMonday() { assertEquals(LocalDate.of(2026,11,16),StudyMath.weekStart(LocalDate.of(2026,11,17))); }
}
