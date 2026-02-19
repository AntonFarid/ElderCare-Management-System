using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using SmartElderlyCare.Domain.Interfaces;
using SmartElderlyCare.Infrastructure.Data.Context;

namespace SmartElderlyCare.Infrastructure.Data.Repositories;

/// <summary>
/// Generic repository implementation with common CRUD operations
/// Implements soft delete pattern as approved
/// </summary>
/// <typeparam name="T">Entity type</typeparam>
public class GenericRepository<T> : IGenericRepository<T> where T : class
{
    protected readonly ApplicationDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public GenericRepository(ApplicationDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    /// <summary>
    /// Get entity by id
    /// </summary>
    public virtual async Task<T?> GetByIdAsync(int id)
    {
        return await _dbSet.FindAsync(id);
    }

    /// <summary>
    /// Get all entities (including soft deleted if not filtered)
    /// </summary>
    public virtual async Task<IEnumerable<T>> GetAllAsync()
    {
        return await _dbSet.ToListAsync();
    }

    /// <summary>
    /// Find entities by predicate
    /// </summary>
    public virtual async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
    {
        return await _dbSet.Where(predicate).ToListAsync();
    }

    /// <summary>
    /// Add new entity
    /// </summary>
    public virtual async Task<T> AddAsync(T entity)
    {
        await _dbSet.AddAsync(entity);
        return entity;
    }

    /// <summary>
    /// Update existing entity
    /// </summary>
    public virtual Task UpdateAsync(T entity)
    {
        _dbSet.Attach(entity);
        _context.Entry(entity).State = EntityState.Modified;
        return Task.CompletedTask;
    }

    /// <summary>
    /// Hard delete - physically remove from database
    /// </summary>
    public virtual async Task DeleteAsync(T entity)
    {
        // Check if entity implements soft delete
        if (entity is Domain.Common.BaseEntity baseEntity)
        {
            await SoftDeleteAsync(entity);
        }
        else
        {
            _dbSet.Remove(entity);
        }
    }

    /// <summary>
    /// Soft delete - set IsDeleted flag instead of physical removal
    /// </summary>
    public virtual Task SoftDeleteAsync(T entity)
    {
        // Use reflection to set IsDeleted property if it exists
        var property = typeof(T).GetProperty("IsDeleted");
        if (property != null && property.CanWrite)
        {
            property.SetValue(entity, true);

            // Set DeletedAt if property exists
            var deletedAtProp = typeof(T).GetProperty("DeletedAt");
            if (deletedAtProp != null && deletedAtProp.CanWrite)
            {
                deletedAtProp.SetValue(entity, DateTime.UtcNow);
            }

            _context.Entry(entity).State = EntityState.Modified;
        }
        else
        {
            // Fallback to hard delete if soft delete not supported
            _dbSet.Remove(entity);
        }

        return Task.CompletedTask;
    }

    /// <summary>
    /// Check if any entity exists matching predicate
    /// </summary>
    public virtual async Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate)
    {
        return await _dbSet.AnyAsync(predicate);
    }

    /// <summary>
    /// Count entities matching optional predicate
    /// </summary>
    public virtual async Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null)
    {
        if (predicate == null)
            return await _dbSet.CountAsync();

        return await _dbSet.CountAsync(predicate);
    }

    /// <summary>
    /// Get paged results with filtering, ordering, and includes
    /// </summary>
    public virtual async Task<IEnumerable<T>> GetPagedAsync(
        int pageNumber,
        int pageSize,
        Expression<Func<T, bool>>? filter = null,
        Func<IQueryable<T>, IOrderedQueryable<T>>? orderBy = null,
        params Expression<Func<T, object>>[] includes)
    {
        IQueryable<T> query = _dbSet;

        // Apply filter
        if (filter != null)
        {
            query = query.Where(filter);
        }

        // Apply includes
        if (includes != null)
        {
            query = includes.Aggregate(query, (current, include) => current.Include(include));
        }

        // Apply ordering
        if (orderBy != null)
        {
            query = orderBy(query);
        }

        // Apply pagination
        return await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    /// <summary>
    /// Get queryable for building complex queries
    /// </summary>
    protected IQueryable<T> GetQueryable(
        Expression<Func<T, bool>>? filter = null,
        Func<IQueryable<T>, IOrderedQueryable<T>>? orderBy = null,
        params Expression<Func<T, object>>[] includes)
    {
        IQueryable<T> query = _dbSet;

        if (filter != null)
        {
            query = query.Where(filter);
        }

        if (includes != null)
        {
            query = includes.Aggregate(query, (current, include) => current.Include(include));
        }

        if (orderBy != null)
        {
            query = orderBy(query);
        }

        return query;
    }
}