package com.hyouem.portfolio;
import java.time.LocalDate;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api")
public class StudyController {
  private final JdbcTemplate db;
  StudyController(JdbcTemplate db){this.db=db;}
  private UUID user(Authentication auth){return UUID.fromString(auth.getName());}
  public record CourseIn(String title,Integer totalLessons){}
  public record ProgressIn(Integer completedLessons){}
  public record SessionIn(UUID courseId,String topic,Integer minutes,LocalDate studiedOn){}
  public record NoteIn(UUID courseId,String title,String content){}
  public record GoalIn(Integer weeklyMinutes){}
  @GetMapping("/courses")
  public List<Map<String,Object>> courses(Authentication auth){
    return db.queryForList("select id,title,total_lessons,completed_lessons,created_at from study_courses where user_id=? order by created_at desc",user(auth));
  }
  @PostMapping("/courses")
  public ResponseEntity<?> addCourse(Authentication auth,@RequestBody CourseIn data){
    if(data==null||data.title()==null||data.title().isBlank()||data.title().length()>120||data.totalLessons()==null||data.totalLessons()<1||data.totalLessons()>10000)
      throw new IllegalArgumentException("Title and 1-10000 total lessons are required");
    UUID id=UUID.randomUUID();
    db.update("insert into study_courses(id,user_id,title,total_lessons) values(?,?,?,?)",id,user(auth),data.title().strip(),data.totalLessons());
    return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id",id));
  }
  @PutMapping("/courses/{id}/progress")
  public Map<String,Object> progress(Authentication auth,@PathVariable UUID id,@RequestBody ProgressIn data){
    if(data==null||data.completedLessons()==null||data.completedLessons()<0)throw new IllegalArgumentException("Invalid completedLessons");
    int changed=db.update("update study_courses set completed_lessons=? where id=? and user_id=? and total_lessons>=?",data.completedLessons(),id,user(auth),data.completedLessons());
    if(changed==0)throw new IllegalArgumentException("Course not found or completedLessons exceeds total");
    return Map.of("updated",true);
  }
  @DeleteMapping("/courses/{id}")
  public ResponseEntity<Void> deleteCourse(Authentication auth,@PathVariable UUID id){
    int n=db.update("delete from study_courses where id=? and user_id=?",id,user(auth));
    return n==0?ResponseEntity.notFound().build():ResponseEntity.noContent().build();
  }
  private void ownedCourse(UUID courseId,UUID user){
    if(courseId==null||db.queryForObject("select count(*) from study_courses where id=? and user_id=?",Integer.class,courseId,user)==0)
      throw new IllegalArgumentException("Course not found");
  }
  @GetMapping("/sessions")
  public List<Map<String,Object>> sessions(Authentication auth){
    return db.queryForList("select s.id,s.topic,s.minutes,s.studied_on,s.course_id,c.title as course_title from study_sessions s join study_courses c on c.id=s.course_id where s.user_id=? order by s.studied_on desc,s.created_at desc limit 100",user(auth));
  }
  @PostMapping("/sessions")
  public ResponseEntity<?> addSession(Authentication auth,@RequestBody SessionIn data){
    if(data==null||data.minutes()==null||data.minutes()<1||data.minutes()>1440||data.topic()==null||data.topic().isBlank()||data.topic().length()>150||data.studiedOn()==null)
      throw new IllegalArgumentException("Invalid session (topic, 1-1440 minutes, date required)");
    UUID owner=user(auth);ownedCourse(data.courseId(),owner);
    UUID id=UUID.randomUUID();
    db.update("insert into study_sessions(id,user_id,course_id,topic,minutes,studied_on) values(?,?,?,?,?,?)",id,owner,data.courseId(),data.topic().strip(),data.minutes(),data.studiedOn());
    return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id",id));
  }
  @GetMapping("/notes")
  public List<Map<String,Object>> notes(Authentication auth){
    return db.queryForList("select n.id,n.title,n.content,n.created_at,c.title as course_title from study_notes n join study_courses c on c.id=n.course_id where n.user_id=? order by n.created_at desc limit 100",user(auth));
  }
  @PostMapping("/notes")
  public ResponseEntity<?> addNote(Authentication auth,@RequestBody NoteIn data){
    if(data==null||data.title()==null||data.title().isBlank()||data.title().length()>150||data.content()==null||data.content().isBlank()||data.content().length()>10000)
      throw new IllegalArgumentException("Invalid note (title/content required)");
    UUID owner=user(auth);ownedCourse(data.courseId(),owner);
    UUID id=UUID.randomUUID();
    db.update("insert into study_notes(id,user_id,course_id,title,content) values(?,?,?,?,?)",id,owner,data.courseId(),data.title().strip(),data.content().strip());
    return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id",id));
  }
  @PutMapping("/goal")
  public Map<String,Object> goal(Authentication auth,@RequestBody GoalIn data){
    if(data==null||data.weeklyMinutes()==null||data.weeklyMinutes()<1||data.weeklyMinutes()>10080)throw new IllegalArgumentException("Weekly target must be 1-10080 minutes");
    db.update("insert into study_goals(user_id,weekly_minutes) values(?,?) on conflict(user_id) do update set weekly_minutes=excluded.weekly_minutes",user(auth),data.weeklyMinutes());
    return Map.of("weekly_minutes",data.weeklyMinutes());
  }
  @GetMapping("/dashboard")
  public Map<String,Object> dashboard(Authentication auth,
      @RequestParam(required=false) LocalDate from,@RequestParam(required=false) LocalDate to){
    UUID owner=user(auth); LocalDate end=to==null?LocalDate.now():to;
    LocalDate start=from==null?end.minusDays(13):from;
    if(start.isAfter(end)||start.isBefore(end.minusYears(2)))throw new IllegalArgumentException("Invalid period (max 2 years)");
    long minutes=db.queryForObject("select coalesce(sum(minutes),0) from study_sessions where user_id=? and studied_on between ? and ?",Long.class,owner,start,end);
    int courseCount=db.queryForObject("select count(*) from study_courses where user_id=?",Integer.class,owner);
    int complete=db.queryForObject("select count(*) from study_courses where user_id=? and completed_lessons=total_lessons",Integer.class,owner);
    var daily=db.queryForList("select studied_on::text as day,sum(minutes) as minutes from study_sessions where user_id=? and studied_on between ? and ? group by studied_on order by studied_on",owner,start,end);
    List<Integer> targets=db.query("select weekly_minutes from study_goals where user_id=?",(rs,i)->rs.getInt(1),owner);
    int target=targets.isEmpty()?420:targets.get(0);
    LocalDate weekStart=StudyMath.weekStart(LocalDate.now());
    long week=db.queryForObject("select coalesce(sum(minutes),0) from study_sessions where user_id=? and studied_on between ? and ?",Long.class,owner,weekStart,LocalDate.now());
    String recommendation=courseCount==0?"Cadastre sua primeira trilha de estudos.":week<target?"Reserve mais "+(target-week)+" minutos nesta semana para atingir sua meta.":"Meta semanal atingida. Revise suas anotacoes e avance para a proxima etapa.";
    Map<String,Object> result=new LinkedHashMap<>();
    result.put("from",start);result.put("to",end);result.put("total_minutes",minutes);result.put("course_count",courseCount);result.put("completed_courses",complete);
    result.put("weekly_minutes",week);result.put("weekly_target",target);result.put("daily",daily);result.put("recommendation",recommendation);
    return result;
  }
}
