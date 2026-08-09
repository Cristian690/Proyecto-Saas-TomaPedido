package com.tomapedido.backend.service;

import lombok.*;
import com.tomapedido.backend.entity.Category;
import com.tomapedido.backend.entity.Tenant;
import com.tomapedido.backend.dto.CategoryResponse;
import com.tomapedido.backend.dto.CreateCategoryRequest;
import com.tomapedido.backend.repository.CategoryRepository;
import com.tomapedido.backend.repository.TenantRepository;
import java.util.List;
import java.util.ArrayList;

import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final TenantRepository tenantRepository;
    
    public CategoryResponse createCategory(CreateCategoryRequest request){       

        Tenant tenant = tenantRepository.findById(request.getTenantId()).orElseThrow();

        Category nuevaCategoria = new Category();

        nuevaCategoria.setName(request.getName());
        nuevaCategoria.setDescription(request.getDescription());
        nuevaCategoria.setImageUrl(request.getImageUrl());
        nuevaCategoria.setActive(true);
        nuevaCategoria.setTenant(tenant);

        Category savedCategory = categoryRepository.save(nuevaCategoria);

        return toResponse(savedCategory);

    }

    private CategoryResponse toResponse(Category category){

        CategoryResponse categoryResponse = new CategoryResponse();

        categoryResponse.setId(category.getId());
        categoryResponse.setName(category.getName());
        categoryResponse.setDescription(category.getDescription());
        categoryResponse.setImageUrl(category.getImageUrl());
        categoryResponse.setActive(category.isActive());
        categoryResponse.setTenantId(category.getTenant().getId());

        return categoryResponse;

    }

    public CategoryResponse getCategoryById(Long id){

        Category category = categoryRepository.findById(id).orElseThrow();

        return toResponse(category);
    }

    public List<CategoryResponse> getAllCategories(){

        List <Category> categories = categoryRepository.findAll();
        
        List <CategoryResponse> responses =   new ArrayList<>();

        for (Category category : categories){
            responses.add(toResponse(category));
        }

        return responses;
        
    }

    public CategoryResponse updateCategory(Long id, CreateCategoryRequest request){
                
        Category category = categoryRepository.findById(id).orElseThrow();
        Tenant tenant = tenantRepository.findById(request.getTenantId()).orElseThrow();
        
        category.setName(request.getName());
        category.setDescription(request.getDescription());
        category.setImageUrl(request.getImageUrl());
        category.setTenant(tenant);
        
        categoryRepository.save(category);

        return toResponse(category);

    }

    public void deleteCategory(Long id){

        Category category = categoryRepository.findById(id).orElseThrow();

        category.setActive(false);        

        categoryRepository.save(category);

    } 

}
