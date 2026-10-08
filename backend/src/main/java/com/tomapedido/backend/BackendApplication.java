package com.tomapedido.backend;

import java.util.Arrays;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.context.ConfigurableApplicationContext;

@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		boolean passwordResetCommand = Arrays.stream(args)
				.anyMatch("--ordenflash.password-reset.enabled=true"::equals);

		SpringApplication application = new SpringApplication(BackendApplication.class);

		if (passwordResetCommand) {
			application.setWebApplicationType(WebApplicationType.NONE);
		}

		ConfigurableApplicationContext context = application.run(args);

		if (passwordResetCommand) {
			System.exit(SpringApplication.exit(context));
		}
	}

}
