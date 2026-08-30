---
title: Spring Boot 统一异常处理的基本实践
subtitle: 让接口错误响应保持一致
date: 2026-01-03 10:00:00
updated: 2026-08-30 19:20:00
categories:
  - Spring
  - 面试笔记
tags:
  - Spring Boot
  - RESTful API
  - 后端开发
---

前端调用接口时，最怕每个接口返回一套不同的错误格式。统一异常处理可以把参数错误、业务异常和未预期异常集中处理，让控制器只关注正常业务流程。

## 为什么需要统一处理

如果在每个控制器方法中都写 `try-catch`，业务代码会被重复的错误分支包围。更重要的是，不同接口很容易返回不同字段，调用方需要编写额外的兼容逻辑。

Spring Boot 中可以使用 `@RestControllerAdvice` 配合 `@ExceptionHandler` 集中处理异常：

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ApiResponse<Void> handleArgument(IllegalArgumentException ex) {
        return ApiResponse.failure("INVALID_ARGUMENT", ex.getMessage());
    }
}
```

控制器中只保留参数和业务调用：

```java
@PostMapping("/users")
public ApiResponse<UserView> create(@Valid @RequestBody CreateUserRequest request) {
    return ApiResponse.success(userService.create(request));
}
```

## 需要区分的异常类型

- **参数校验异常**：返回明确的字段错误，帮助调用方修正请求。
- **业务异常**：例如资源不存在、状态不允许操作，返回稳定的业务错误码。
- **系统异常**：记录完整日志，但对外只返回通用提示，避免暴露堆栈和内部实现。

错误码应该稳定，错误信息则要兼顾可读性。日志中还应带上请求路径、用户标识和 trace id，便于定位问题。

## 常见陷阱

不要捕获所有异常后直接返回“操作失败”，这会掩盖真正的程序错误；也不要把数据库异常、堆栈信息直接返回给客户端。统一处理的目标是统一接口契约，同时保留足够的服务端诊断信息。
